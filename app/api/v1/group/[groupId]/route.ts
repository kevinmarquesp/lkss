import { db } from "@/db";
import { groupsTable, linksTable } from "@/db/schema";
import { routeHandler, when } from "@/utils/api";
import { and, eq, isNull, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { NextRequest } from "next/server";
import { z } from "zod";

const getParamsValidator = z.object({
  groupId: z.string().length(8),
});
const getSearchValidator = z.object({}).optional();

type GetParams = z.infer<typeof getParamsValidator>;
type GetSearch = z.infer<typeof getSearchValidator>;

async function GET(request: NextRequest, { params }: { params: Promise<GetParams> }) {
  return await routeHandler("GET /api/dev/group/[groupId]", async () => {
    return await executeGet(request, db, {
      params: getParamsValidator.parse(await params),
      search: getSearchValidator.parse(request.nextUrl.searchParams),
    });
  });
}

/**
 * It starts by checking if the group has any childs to begin with, then if
 * there is some child linked with the specified group it will return the
 * gorup data and each child's data as well.
 */
async function executeGet(_request: NextRequest, db: LibSQLDatabase, props: {
  params: GetParams;
  search: GetSearch;
}) {
  const linksFindByGroupParentIdResults = await db
    .select({
      id: linksTable.id,
      url: linksTable.url,
      updatedAt: linksTable.updatedAt,
    })
    .from(linksTable)
    .where(eq(linksTable.groupId, props.params.groupId));

  // If the group has no childs, then it should be deleted and say that it doesn't exists.
  if (linksFindByGroupParentIdResults.length === 0) {
    await db
      .update(linksTable)
      .set({
        groupId: null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      });
    await db
      .delete(groupsTable)
      .where(eq(groupsTable.id, props.params.groupId));

    when(true).throw("Group ID not found").status(404);
  }

  const groupsFindByIdResults = await db
    .select({
      id: groupsTable.id,
      title: groupsTable.title,
      updatedAt: groupsTable.updatedAt,
    })
    .from(groupsTable)
    .where(eq(groupsTable.id, props.params.groupId));

  console.log(groupsFindByIdResults);

  when(groupsFindByIdResults.length === 0)
    .throw("Group ID not found").status(404);

  return {
    ...groupsFindByIdResults[0],
    children: linksFindByGroupParentIdResults,
  };
}

export {
  getParamsValidator,
  getSearchValidator,
  type GetParams,
  type GetSearch,
  GET,
  executeGet,
};
