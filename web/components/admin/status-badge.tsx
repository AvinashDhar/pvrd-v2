import { cn } from "@/lib/utils";

const tones = {
  active: "bg-[#f3f8e4] text-[#5f7a18] ring-[#d7e8a8]",
  approved: "bg-[#f3f8e4] text-[#5f7a18] ring-[#d7e8a8]",
  sent: "bg-[#f3f8e4] text-[#5f7a18] ring-[#d7e8a8]",
  ready: "bg-[#f3f8e4] text-[#5f7a18] ring-[#d7e8a8]",
  contacted: "bg-[#e8f0f6] text-[#003C6C] ring-[#c5d6e4]",
  scheduled: "bg-[#e8f0f6] text-[#306084] ring-[#c5d6e4]",
  pending: "bg-[#f7f3e3] text-[#8a7424] ring-[#eadfb8]",
  generating: "bg-[#f7f3e3] text-[#8a7424] ring-[#eadfb8]",
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  inactive: "bg-[#fdecec] text-[#c24141] ring-[#f4c7c7]",
  blocked: "bg-[#fdecec] text-[#c24141] ring-[#f4c7c7]",
  hidden: "bg-slate-100 text-slate-600 ring-slate-200",
  stale: "bg-[#f7f3e3] text-[#8a7424] ring-[#eadfb8]",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
  ended: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

export function StatusBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const tone = tones[value as keyof typeof tones] ?? tones.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1",
        tone,
        className,
      )}
    >
      {value}
    </span>
  );
}
