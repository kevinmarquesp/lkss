import { db } from "@/db";
import { linksTable } from "@/db/schema";
import { routeHandler } from "@/utils/api";
import { asc, eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import { z } from "zod";

const postParamsValidator = z.object({}).optional();
const postSearchValidator = z.object({}).optional();
const postBodyValidator = z.object({
  url: z.string().url(),
});

type PostParams = z.infer<typeof postParamsValidator>;
type PostSearch = z.infer<typeof postSearchValidator>;
type PostBody = z.infer<typeof postBodyValidator>;

async function POST(request: NextRequest, { params }: { params: Promise<PostParams> }) {
  return await routeHandler("POST /api/dev/create", async () => {
    return await executePost(request, db, {
      params: postParamsValidator.parse(await params),
      search: postSearchValidator.parse(request.nextUrl.searchParams),
      body: postBodyValidator.parse(await request.json()),
    });
  });
}

/**
 * This route actually tries to find a record that already has the specified
 * URL before considering creating one. It even will restore a *dead* record
 * if it can be used instead of creating a new one.
 */
async function executePost(_request: NextRequest, db: LibSQLDatabase, props: {
  params: PostParams;
  search: PostSearch;
  body: PostBody;
}) {
  const linksFindByUrlResults = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.url, props.body.url))
    .orderBy(asc(linksTable.deletedAt));

  // Just create one if this URL wasn't already being used, other wise, search for it.
  if (linksFindByUrlResults.length === 0) {
    return (await db
      .insert(linksTable)
      .values({
        id: nanoid(8),
        url: props.body.url,
      })
      .returning({
        id: linksTable.id,
        url: linksTable.url,
        createdAt: linksTable.createdAt,
        updatedAt: linksTable.updatedAt,
      }))[0];
  }

  const firstLinkRecord = linksFindByUrlResults[0];

  // Restore a dead record to not waste disk space if possible.
  if (firstLinkRecord.deletedAt) {
    return (await db
      .update(linksTable)
      .set({
        updatedAt: sql`CURRENT_TIMESTAMP`,
        deletedAt: null,
      })
      .where(eq(linksTable.id, firstLinkRecord.id))
      .returning({
        id: linksTable.id,
        url: linksTable.url,
        createdAt: linksTable.createdAt,
        updatedAt: linksTable.updatedAt,
      }))[0];
  }

  return (await db
    .update(linksTable)
    .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(linksTable.id, firstLinkRecord.id))
    .returning({
      id: linksTable.id,
      url: linksTable.url,
      createdAt: linksTable.createdAt,
      updatedAt: linksTable.updatedAt,
    }))[0];
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

