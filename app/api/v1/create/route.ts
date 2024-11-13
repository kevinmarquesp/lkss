import { db } from "@/db";
import { linksTable, publicLinkSchema } from "@/db/schema";
import { routeHandler } from "@/utils/api";
import { eq } from "drizzle-orm";
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
  return await routeHandler("POST /api/v1/create", async () => {
    return await executePost(request, db, {
      params: postParamsValidator.parse(await params),
      search: postSearchValidator.parse(request.nextUrl.searchParams),
      body: postBodyValidator.parse(await request.json()),
    });
  });
}

/**
 * This route actually tries to find a record that already has the specified
 * URL before considering creating one, other wise, a new URL entry will be
 * created.
 */
async function executePost(_request: NextRequest, db: LibSQLDatabase, props: {
  params: PostParams;
  search: PostSearch;
  body: PostBody;
}) {
  const [existing] = await db
    .select(publicLinkSchema)
    .from(linksTable)
    .where(eq(linksTable.url, props.body.url))
    .limit(1);

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

