import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@radix-ui/react-separator";
import { Code, Plus, Sparkles, Trash } from "lucide-react";

export default async function Page() {
  return (
    <>
      <main className="h-screen grid place-items-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              Short URL Group Colection Creation
            </CardTitle>
            <CardDescription>
              Shorten multiple URL&apos;s and save them into a single group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GroupForm />
          </CardContent>
          <CardFooter className="text-sm text-zinc-600 flex gap-4">
            <a href="https://github.com/kevinmarquesp/sus" target="_blank" className="inline-flex items-center gap-1.5 hover:underline">
              <Code className="size-4 inline-block" />
              Source code
            </a>
            <Separator orientation="vertical" className="h-6" />
            <a href="http://discordapp.com/users/n_station" target="_blank" className="inline-flex items-center gap-1.5 hover:underline">
              Discord
            </a>
          </CardFooter>
        </Card>
      </main>
    </>

  );
}

async function GroupForm() {
  const urlList = [
    "https://example.com/8de20f9a-e3bd-4ea9-ac19-c789da57a6a6",
    "https://example.com/9917593e-67e1-41cc-9655-a9fe358f5827",
    "https://example.com/b3bf6029-0976-4629-abad-3a54a36c8fc8",
    "https://example.com/bd2cabab-ef0c-4e0f-8723-3737f5ca4065",
    "https://example.com/6d2fc23b-03ab-4c16-afad-1aa5261255e4",
  ];

  return (
    <>
      <form action="none" className="space-y-4">
        <Input placeholder="Group title" />
        <ul className="divide-y-2">
          {urlList.map((url, key) => ((
            <li key={key} className="py-2 px-1 flex gap-3 items-center">
              <span className="text-sm overflow-hidden h-5 break-all line-clamp-1">
                {url}
              </span>
              <Button size="icon" variant="destructive">
                <Trash />
              </Button>
            </li>
          )))}
        </ul>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Insert a new URL" />
            <Button size="icon">
              <Plus />
            </Button>
          </div>
          <Button className="w-full">
            Create group! <Sparkles />
          </Button>
        </div>
      </form>
    </>
  );
}
