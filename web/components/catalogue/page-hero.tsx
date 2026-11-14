import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow = "OM PVRD catalogue",
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className="pvrd-kicker">{eyebrow}</p>
      <h1 className="mt-2 font-heading text-[1.75rem] leading-tight font-semibold tracking-tight text-primary sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
