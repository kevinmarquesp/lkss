import { db } from "@/db";
import { linksTable } from "@/db/schema";
import { routeHandler, when } from "@/utils/api";
import { and, eq, isNull } from "drizzle-orm";
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
  return await routeHandler("GET /api/dev/[linkId]", async () => {
    return await executeGet(request, db, {
      params: getParamsValidator.parse(await params),
      search: getSearchValidator.parse(request.nextUrl.searchParams),
    });
  });
}

/**
 * Given a link ID from the Next.js dynamic route parameters, it will just
 * return the relevant information about that link -- The `createdAt` and
 * `updatedAt` is useful for running some maintenance scripts if needed. A 404
 * error should be returned if any links was found with this particular ID.
 */
async function executeGet(_request: NextRequest, db: LibSQLDatabase, props: {
  params: GetParams;
  search: GetSearch;
}) {
  const linksFindByIdResults = await db
    .select({
      id: linksTable.id,
      url: linksTable.url,
      createdAt: linksTable.createdAt,
      updatedAt: linksTable.updatedAt,
    })
    .from(linksTable)
    .where(and(
      eq(linksTable.id, props.params.linkId),
      isNull(linksTable.deletedAt),
    ));

  when(linksFindByIdResults.length === 0).throw("ID not found").status(404);

  return linksFindByIdResults[0];
}

export {
  getParamsValidator,
  getSearchValidator,
  type GetParams,
  type GetSearch,
  GET,
  executeGet,
};

