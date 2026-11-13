import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

const palettes = {
  blue: "bg-[#e8f0f6] text-[#003C6C]",
  green: "bg-[#f3f8e4] text-[#7FA82E]",
  purple: "bg-[#e8f0f6] text-[#306084]",
  orange: "bg-[#f3f8e4] text-[#5f7a18]",
  teal: "bg-[#e8f0f6] text-[#185478]",
  red: "bg-[#fdecec] text-[#c24141]",
} as const;

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  tone = "blue",
  delay = 0,
  prefix,
}: {
  label: string;
  value: number | string;
  change?: number;
  icon: LucideIcon;
  tone?: keyof typeof palettes;
  delay?: number;
  prefix?: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <article
      className="stat-enter pvrd-card pvrd-card-interactive group p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-heading text-2xl font-semibold tracking-tight tabular-nums">
            {prefix}
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
        </div>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
            palettes[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      {change !== undefined && (
        <p
          className={cn(
            "mt-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            up ? "bg-[#f3f8e4] text-[#5f7a18]" : "bg-[#fdecec] text-[#c24141]",
          )}
        >
          {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          {Math.abs(change)}% this month
        </p>
      )}
    </article>
  );
}
