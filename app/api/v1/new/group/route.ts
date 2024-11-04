import { db } from "@/db";
import { groupsTable, linksTable } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodyValidator = z.object({
  title: z
    .string()
    .min(1),
  targets: z
    .array(z.string().url())
    .min(2),
});

type Body = z.infer<typeof bodyValidator>

export async function POST(req: Request) {
  try {
    const result = await post({
      origin: new URL(req.url).origin,
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

async function post(props: {
  origin: string;
  body: Body;
}) {
  const newGroupCreationResults = await db
    .insert(groupsTable)
    .values({
      id: nanoid(8),
      title: props.body.title,
    })
    .returning({
      id: groupsTable.id,
      createdAt: groupsTable.createdAt,
    });

  const groupId = newGroupCreationResults[0].id;
  let links = [];

  for (const target of props.body.targets) {
    // Check if there is any target equals to this one that has no groups.

    const findLinkTargetResults = await db
      .select({
        id: linksTable.id,
      })
      .from(linksTable)
      .where(
        and(
          eq(linksTable.target, target),
          isNull(linksTable.groupId),
        ),
      );

    let linkId;

    // If the link already exists, and it's available, use this one.
    // Other wise, create a new one just for this new group.

    if (findLinkTargetResults.length > 0) {
      linkId = findLinkTargetResults[0].id;

    } else {
      const newLinkCreationResults = await db
        .insert(linksTable)
        .values({
          id: nanoid(8),
          target,
        })
        .returning({
          id: linksTable.id,
        });

      linkId = newLinkCreationResults[0].id;
    }

    // Now, asign the group ID to this target!

    const updateLinkGroupIdFieldResults = await db
      .update(linksTable)
      .set({
        groupId: groupId,
      })
      .where(
        and(
          eq(linksTable.id, linkId),
          isNull(linksTable.groupId),
        ),
      )
      .returning({
        target: linksTable.target,
        createdAt: linksTable.createdAt,
      });

    links.push({
      ...updateLinkGroupIdFieldResults[0],
      url: `${props.origin}/${linkId}`,
    });
  }

  return {
    ...newGroupCreationResults[0],
    url: `${props.origin}/g/${groupId}`,
    links,
  };
}
