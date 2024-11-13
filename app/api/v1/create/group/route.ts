import { db } from "@/db";
import { groupsTable, linksTable, publicLinkSchema } from "@/db/schema";
import { serviceWrapper } from "@/utils/api";
import { eq, or, sql } from "drizzle-orm";
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
  return await serviceWrapper("POST /api/v1/create/group", async () => {
    return await executePost(request, db, {
      params: postParamsValidator.parse(await params),
      search: postSearchValidator.parse(request.nextUrl.searchParams),
      body: postBodyValidator.parse(await request.json()),
    });
  });
}

/**
 * It starts by fetching the already used links by the URL, then it batches the
 * group creation query and the URL insertion/update queries depending if it
 * was used or not -- Better than a slow `for` loop, you know.
 */
async function executePost(_request: NextRequest, db: LibSQLDatabase, props: {
  params: PostParams;
  search: PostSearch;
  body: PostBody;
}) {
  const groupId = nanoid(8);

  const existingLinks = await db
    .select({ id: linksTable.id, url: linksTable.url })
    .from(linksTable)
    .where(or(
      ...props.body.children.map((child) =>
        eq(linksTable.url, child)),
    ));

  const batchResults = await db.batch([
    db
      .insert(groupsTable)
      .values({
        id: groupId,
        title: props.body.title,
        token: nanoid(12),
      })
      .returning(),
    ...getChildrenActions(),
  ]);

  const [group] = batchResults.shift()!;
  const children = batchResults.map(([child]) => child);  // Flatern matrix.

  return { ...group, children };

  /** Get the links insertion/updating actions for the group batching query. */
  function getChildrenActions() {
    const actions = [];

    for (const { id } of existingLinks) {
      const action = db
        .update(linksTable)
        .set({ groupId, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(linksTable.id, id))
        .returning(publicLinkSchema);

      actions.push(action);
    }

    const existingUrls = existingLinks.map(({ url }) => url);
    const filteredChildren = props.body.children.filter((child) =>
      !existingUrls.includes(child));

    for (const url of filteredChildren) {
      const action = db
        .insert(linksTable)
        .values({ id: nanoid(8), url })
        .returning(publicLinkSchema);

      actions.push(action);
    }

    return actions;
  }
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

