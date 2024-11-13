import { db } from "@/db";
import { linksTable, publicLinkSchema } from "@/db/schema";
import { serviceWrapper } from "@/utils/api";
import { eq, sql } from "drizzle-orm";
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
  return await serviceWrapper("POST /api/v1/create", async () => {
    return await executePost(request, db, {
      params: postParamsValidator.parse(await params),
      search: postSearchValidator.parse(request.nextUrl.searchParams),
      body: postBodyValidator.parse(await request.json()),
    });
  });
}

/**
 * It returns the first ID and the URL that matches with the data input, if
 * there is any links already inserted with that data, only then it will create
 * a new record on the database.
 */
async function executePost(_request: NextRequest, db: LibSQLDatabase, props: {
  params: PostParams;
  search: PostSearch;
  body: PostBody;
}) {
  const [existing] = await db
    .update(linksTable)
    .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(linksTable.url, props.body.url))
    .returning(publicLinkSchema);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(linksTable)
    .values({ id: nanoid(8), url: props.body.url })
    .returning(publicLinkSchema);

  return created;
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

