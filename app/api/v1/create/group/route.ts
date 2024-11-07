import { db } from "@/db";
import { groupsTable, linksTable } from "@/db/schema";
import { routeHandler } from "@/utils/api";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import { z } from "zod";

const postParamsValidator = z.object({}).optional();
const postSearchValidator = z.object({}).optional();
const postBodyValidator = z.object({
  title: z.string().optional(),
  children: z.array(z.string().url()).min(1),
});

type PostParams = z.infer<typeof postParamsValidator>;
type PostSearch = z.infer<typeof postSearchValidator>;
type PostBody = z.infer<typeof postBodyValidator>;

async function POST(request: NextRequest, { params }: { params: Promise<PostParams> }) {
  return await routeHandler("POST /api/dev/create/group", async () => {
    return await executePost(request, db, {
      params: postParamsValidator.parse(await params),
      search: postSearchValidator.parse(request.nextUrl.searchParams),
      body: postBodyValidator.parse(await request.json()),
    });
  });
}

/**
 * Creates a new group and generate an access token for future editings, each
 * child will pass through the same logic as the `/api/xxx/create` route --
 * it will reuse existing entries if `groupId` is `NULL`.
 */
async function executePost(_request: NextRequest, db: LibSQLDatabase, props: {
  params: PostParams;
  search: PostSearch;
  body: PostBody;
}) {
  const group = (await db
    .insert(groupsTable)
    .values({
      id: nanoid(8),
      token: nanoid(12),
      title: props.body.title,
    })
    .returning({
      id: groupsTable.id,
      title: groupsTable.title,
      token: groupsTable.token,
      updatedAt: groupsTable.updatedAt,
    }))[0];

  let children = [];

  // For each child URL, it should reuse alone records or create a new one for this group.
  for (const childUrl of props.body.children) {
    const linksFindByUrlResults = await db
      .select()
      .from(linksTable)
      .where(and(
        eq(linksTable.url, childUrl),
        isNull(linksTable.groupId),
      ));

    // If any URL was found, create a new one and use it.
    if (linksFindByUrlResults.length === 0) {
      children.push((await db
        .insert(linksTable)
        .values({
          id: nanoid(8),
          url: childUrl,
          groupId: group.id,
        })
        .returning({
          id: linksTable.id,
          url: linksTable.url,
          updatedAt: linksTable.updatedAt,
        }))[0]);

      continue;
    }

    children.push((await db
      .update(linksTable)
      .set({
        groupId: group.id,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(linksTable.id, linksFindByUrlResults[0].id))
      .returning({
        id: linksTable.id,
        url: linksTable.url,
        updatedAt: linksTable.updatedAt,
      }))[0]);
  }

  return { ...group, children };
}

export {
  postParamsValidator,
  postSearchValidator,
  postBodyValidator,
  type PostParams,
  type PostSearch,
  type PostBody,
  POST,
  executePost,
};

