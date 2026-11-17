"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { PvrdLoader } from "@/components/brand/loader";
import { usePendingNavigation } from "@/components/brand/use-pending-navigation";
import { cn } from "@/lib/utils";

export function PendingSubmit({
  className,
  children,
  overlay = false,
  type = "submit",
  disabled,
  ...props
}: ComponentProps<"button"> & { overlay?: boolean }) {
  const { pending } = useFormStatus();
  usePendingNavigation(pending);

  return (
    <button
      type={type}
      {...props}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(className, pending && "cursor-progress")}
    >
      {pending && !overlay ? <PvrdLoader decorative className="size-3.5" /> : null}
      {children}
      {pending && overlay ? (
        <span className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full bg-white text-primary shadow-md">
          <PvrdLoader decorative className="size-4" />
        </span>
      ) : null}
    </button>
  );
}
