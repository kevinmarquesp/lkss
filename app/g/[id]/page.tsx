import { db } from "@/db";
import { linksTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Page({ params }: {
  params: Promise<{ id: string; }>
}) {
  const groupId = (await params).id;

  const groupChilds = await db
    .select({
      target: linksTable.target,
    })
    .from(linksTable)
    .where(eq(linksTable.groupId, groupId));

  console.log(groupChilds);

  return (
    <>
      <div className="h-screen grid place-items-center">
        <main className="space-y-4">
          <ul className="space-y-2 !mt-8">
            {groupChilds.map(({ target }, key) => (
              <li key={key} className="flex gap-2">
                <div className="bg-background p-1.5 pe-4 rounded-lg flex gap-2 w-fit">
                  <span className="bg-zinc-900 size-7 min-w-7 font-bold rounded-md grid place-items-center text-zinc-500">
                    {key + 1}
                  </span>
                  <a href={target} className="text-nowrap overflow-scroll w-[45ch]">
                    {target}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </>
  );
}
