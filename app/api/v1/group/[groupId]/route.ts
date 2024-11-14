import { db } from "@/db";
import { groupsTable, linksTable, publicGroupsSchema, publicLinkSchema } from "@/db/schema";
import { serviceWrapper } from "@/utils/api";
import { assert } from "@/utils/assert";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { NextRequest } from "next/server";
import { z } from "zod";

const getParamsValidator = z.object({
  groupId: z.string().length(8),
});
const getSearchValidator = z.object({}).optional();

type GetParams = z.infer<typeof getParamsValidator>;
type GetSearch = z.infer<typeof getSearchValidator>;

export async function GET(request: NextRequest, { params }: { params: Promise<GetParams> }) {
  return await serviceWrapper("GET /api/v1/group/[groupId]", async () => {
    return await executeGet(request, db, {
      params: getParamsValidator.parse(await params),
      search: getSearchValidator.parse(request.nextUrl.searchParams),
    });
  });
}

/**
 * Uses a batch to asks the database for both the group public data (id and
 * title) and its children at once, increasing performance. If any of those
 * operations returned empty values, a 404 error should be throwed as well.
 */
async function executeGet(_request: NextRequest, db: LibSQLDatabase, props: {
  params: GetParams;
  search: GetSearch;
}) {
  const results = await db.batch([
    db
      .select(publicGroupsSchema)
      .from(groupsTable)
      .where(eq(groupsTable.id, props.params.groupId)),
    db
      .update(linksTable)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(linksTable.groupId, props.params.groupId))
      .returning(publicLinkSchema),
  ]);

  const [group] = results.shift()!;
  const children = results.map(([child]) => child);  // Flatern matrix.

  assert(!group || !children)
    .message("Group ID not found")
    .status(404);

  return { ...group, children };
}
