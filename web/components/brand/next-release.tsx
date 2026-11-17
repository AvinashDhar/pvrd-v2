import type { ReactNode } from "react";
import { nextReleaseMessage } from "@/lib/nav";

export function NextReleaseFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative min-h-48">
      <div className="pointer-events-none blur-[3px] saturate-50 select-none" inert aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-x-0 top-6 z-10 flex justify-center px-4 sm:top-10">
        <div role="status" className="w-full max-w-md rounded-2xl border border-[#003c6c]/10 bg-white/95 p-5 text-center shadow-[0_16px_40px_rgba(0,44,84,0.12)]">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#7FA82E] uppercase">Next release</p>
          <p className="mt-2 font-heading text-lg font-semibold text-primary">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {nextReleaseMessage}. This preview is not active yet.
          </p>
        </div>
      </div>
    </div>
  );
}
