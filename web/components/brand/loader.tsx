import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function PvrdLoader({
  className,
  label = "Loading",
  decorative = false,
  ...props
}: ComponentProps<"span"> & {
  label?: string;
  decorative?: boolean;
}) {
  return (
    <span
      {...props}
      className={cn("pvrd-loader relative inline-grid size-4 shrink-0 place-items-center", className)}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      <svg viewBox="0 0 24 24" className="col-start-1 row-start-1 size-full animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2.4" />
        <path
          d="M12 3.75a8.25 8.25 0 0 1 8.25 8.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="col-start-1 row-start-1 size-[18%] rounded-full bg-current" />
    </span>
  );
}
