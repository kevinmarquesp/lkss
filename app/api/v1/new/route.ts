import { db } from "@/db";
import { linksTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodyValidator = z.object({
  target: z
    .string()
    .url(),
});

type Body = z.infer<typeof bodyValidator>

export async function POST(req: Request) {
  try {
    const result = await post(new URL(req.url).origin, {
      body: bodyValidator.parse(await req.json()),
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

async function post(origin: string, props: {
  body: Body;
}) {
  const checkExistenceResults = await db
    .select({
      id: linksTable.id,
      target: linksTable.target,
      createdAt: linksTable.createdAt,
    })
    .from(linksTable)
    .where(eq(linksTable.target, props.body.target));

  if (checkExistenceResults.length !== 0) {
    return {
      ...checkExistenceResults[0],
      url: `${origin}/${checkExistenceResults[0].id}`,
    };
  }

  const newInsertionResult = await db
    .insert(linksTable)
    .values({
      id: nanoid(8),
      target: props.body.target,
    })
    .returning({
      id: linksTable.id,
      target: linksTable.target,
      createdAt: linksTable.createdAt,
    });

  return {
    ...newInsertionResult[0],
    url: `${origin}/${newInsertionResult[0].id}`,
  };
}
