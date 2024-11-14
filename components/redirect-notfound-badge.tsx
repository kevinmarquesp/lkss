import { FileQuestion } from "lucide-react";

export default function RedirectNotFoundBadge() {
  return (
    <>
      <div role="status" className="size-16 rounded-full border-2 border-yellow-500 bg-yellow-900/15 grid place-items-center text-yellow-500">
        <FileQuestion />
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Bad request
        </span>
      </div>
    </>
  );
}

