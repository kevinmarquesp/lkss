import { db } from "@/db";
import { groupsTable, linksTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const paramsValidator = z.object({
  id: z
    .string()
    .length(8),
});

type Params = z.infer<typeof paramsValidator>;

export async function GET(req: Request, { params }: {
  params: Promise<Params>
}) {
  try {
    const result = await get({
      origin: new URL(req.url).origin,
      params: paramsValidator.parse(await params),
    });

    return Response.json(result);

  } catch (error) {
    const errorStringfied = JSON.stringify(error, Object.getOwnPropertyNames(error));
    const errorObject = JSON.parse(errorStringfied);

    delete errorObject.stack;

    return NextResponse.json({ error: errorObject }, {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
}

async function get(props: {
  origin: string;
  params: Params;
}) {
  const findGroupResults = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, props.params.id));

  if (findGroupResults.length === 0) {
    throw new Error("Group not found");
  }

  const findGroupChildLinksResults = await db
    .select({
      id: linksTable.id,
      createdAt: linksTable.createdAt,
    })
    .from(linksTable)
    .where(eq(linksTable.groupId, props.params.id));

  if (findGroupChildLinksResults.length === 0) {
    throw new Error("Unexpected: Group with no childs");
  }

  return {
    ...findGroupResults[0],
    url: `${props.origin}/${findGroupResults[0].id}`,
    links: findGroupChildLinksResults.map((link) => ({
      ...link,
      url: `${props.origin}/${link.id}`,
    })),
  };
}
