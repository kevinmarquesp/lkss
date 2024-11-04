import { db } from "@/db";
import { linksTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const paramsValidator = z.object({
  id: z
    .string()
    .length(8),
});

type Params = z.infer<typeof paramsValidator>;

export async function GET(_req: Request, { params }: {
  params: Promise<Params>
}) {
  try {
    const result = await get({
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
  params: Params;
}) {
  const findLinkResults = await db
    .select({
      target: linksTable.target,
      createdAt: linksTable.createdAt,
    })
    .from(linksTable)
    .where(eq(linksTable.id, props.params.id));

  if (!findLinkResults[0]) {
    throw new Error("Target link not found");
  }

  return findLinkResults[0];
}
