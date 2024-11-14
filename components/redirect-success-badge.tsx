import { Check } from "lucide-react";

export default function RedirectSuccessBadge() {
  return (
    <>
      <div role="status" className="size-16 rounded-full border-2 border-green-500 bg-green-900/15 grid place-items-center text-green-500">
        <Check />
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Success!
        </span>
      </div>
    </>
  );
}
