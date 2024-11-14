import { cn } from "@/lib/utils";

export default function Spinner(props: { className?: string; }) {
  return (
    <>
      <div role="status" className={cn("size-4 border-2 border-e-0 border-t-0 border-current block animate-spin rounded-full border-solid align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white", props.className)}>
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
    </>
  );
}
