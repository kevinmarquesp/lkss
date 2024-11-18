import ShortenForm from "@/components/shorten-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Code } from "lucide-react";

export default function Page() {
  return (
    <>
      <main className="h-screen grid place-items-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              Stupid URL Shortner
            </CardTitle>
            <CardDescription>
              Create short URL&apos;s without any registration required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShortenForm />
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
