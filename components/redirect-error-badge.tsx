import { X } from "lucide-react";

export default function RedirectErrorBadge() {
  return (
    <>
      <div role="status" className="size-16 rounded-full border-2 border-red-500 bg-red-900/15 grid place-items-center text-red-500">
        <X />
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Error
        </span>
      </div>
    </>
  );
}
