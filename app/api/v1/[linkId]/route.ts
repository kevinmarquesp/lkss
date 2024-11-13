import { db } from "@/db";
import { linksTable, publicLinkSchema } from "@/db/schema";
import { serviceWrapper } from "@/utils/api";
import { assert } from "@/utils/assert";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { NextRequest } from "next/server";
import { z } from "zod";

const getParamsValidator = z.object({
  linkId: z.string().length(8),
});
const getSearchValidator = z.object({}).optional();

type GetParams = z.infer<typeof getParamsValidator>;
type GetSearch = z.infer<typeof getSearchValidator>;

async function GET(request: NextRequest, { params }: { params: Promise<GetParams> }) {
  return await serviceWrapper("GET /api/v1/[linkId]", async () => {
    return await executeGet(request, db, {
      params: getParamsValidator.parse(await params),
      search: getSearchValidator.parse(request.nextUrl.searchParams),
    });
  });
}

/**
 * Given a link ID from the Next.js dynamic route parameters, it will just
 * return the relevant information about that link -- The `updatedAt` propperty
 * is useful for knowing which links are old and OK to delete after a while. A
 * 404 error should be returned if any links was found with this particular ID.
 */
async function executeGet(_request: NextRequest, db: LibSQLDatabase, props: {
  params: GetParams;
  search: GetSearch;
}) {
  const [result] = await db
    .update(linksTable)
    .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(linksTable.id, props.params.linkId))
    .returning(publicLinkSchema);

  assert(!result)
    .message("ID not found")
    .status(404);

  return result;
}

export {
  getParamsValidator,
  getSearchValidator,
  type GetParams,
  type GetSearch,
  GET,
  executeGet,
};

