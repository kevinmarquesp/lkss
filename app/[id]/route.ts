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

    return NextResponse.redirect(new URL(result));

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
  const findTargetByLinkIdResults = await db
    .select({
      target: linksTable.url,
    })
    .from(linksTable)
    .where(eq(linksTable.id, props.params.id));

  if (findTargetByLinkIdResults.length === 0) {
    throw new Error("Could not located the specified target");
  }

  const url = findTargetByLinkIdResults[0].target;

  console.log(url);

  return url;
}
