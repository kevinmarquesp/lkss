import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export default function ShortUrlResult(props: { id: string; url: string; }) {
  const shortUrl = `${window.location.origin}/${props.id}`;

  return (
    <>
      <section className="border border-zinc-800/50 rounded-xl mt-6 p-4">
        <div className="flex flex-col items-start">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <h2 onClick={handleCopyToClipboard} className="block text-start font-bold underline-offset-4 hover:underline cursor-pointer">
                  {shortUrl}
                </h2>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="bg-zinc-800 border border-zinc-700/50 text-white">
                Copy!
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <a href={props.url} target="_blank" className="text-sm text-muted-foreground opacity-50 hover:opacity-100">
            {props.url}
          </a>
        </div>
      </section>
    </>
  );

  function handleCopyToClipboard() {
    navigator.clipboard.writeText(shortUrl);
  }
}
