"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";

export default function Home() {
  const [urls, setUrls] = useState<string[]>([]);
  const [result, setResult] = useState<string>("");

  function addNewUrlClickHandler() {
    const $url: HTMLInputElement | null = document.querySelector("#url");

    if (!$url) {
      throw new Error("Could not locate the #url input field");
    }

    const url = $url.value.trim();

    if (!url || urls.includes(url)) {
      return;
    }

    setUrls([...urls, url]);
  }

  async function shortUrlClickHandler() {
    let resp: Response;

    if (urls.length > 1) {
      const $title: HTMLInputElement | null = document.querySelector("#title");

      if (!$title) {
        throw new Error("Could not locate the #title input field");
      }

      const title = $title.value.trim();

      console.log(urls);

      resp = await fetch("/api/v1/new/group", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, targets: urls }),
      });

    } else {
      resp = await fetch("/api/v1/new", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target: urls[0] }),
      });
    }

    const body = await resp.json();

    setResult(body.url);
  }


  return (
    <>
      <div className="h-screen grid place-items-center">
        <main className="space-y-4">
          <h1 className="text-4xl font-black text-center">
            Link Shortner
          </h1>
          <div className="flex gap-2 w-fit mx-auto"> {/*TODO: Use an <form> tag.*/}
            <Input id="url" className="bg-background" placeholder="URL" />
            <Button variant="secondary" onClick={addNewUrlClickHandler}>
              Add <Plus />
            </Button>
          </div>
          <ul className="space-y-2 !mt-8">
            {urls.map((url, key) => (
              <li key={key} className="flex gap-2">
                <div className="bg-background p-1.5 pe-4 rounded-lg flex gap-2 w-fit">
                  <span className="bg-zinc-900 size-7 min-w-7 font-bold rounded-md grid place-items-center text-zinc-500">
                    {key + 1}
                  </span>
                  <a href={url} className="text-nowrap overflow-scroll w-[45ch]">
                    {url}
                  </a>
                </div>
                <Button variant="outline" className="h-25" onClick={() => {
                  setUrls(urls.filter((_, i) => i !== key));
                }}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 w-fit mx-auto"> {/*TODO: Use an <form> tag.*/}
            <Input id="title" className="bg-background" placeholder="Group title" disabled={urls.length < 2} />
            <Button onClick={shortUrlClickHandler}>
              Short <Sparkles />
            </Button>
          </div>
          {result && <>
            <a href={result} className="text-3xl text-center font-bold !mt-16 block text-cyan-600 hover:underline">
              {result}
            </a>
          </>}
        </main>
      </div>
    </>
  );
}
