import { cn } from "@/lib/utils";
import type { QuotationAttention } from "@/lib/quotations/service";

export function attentionLabel(attention: QuotationAttention) {
  if (attention === "new") return "New";
  return "Needs reply";
}

export function QuotationAttentionMark({
  attention,
  className,
}: {
  attention: QuotationAttention;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[#fff4d6] px-2 py-0.5 text-[11px] font-semibold text-[#8a5a00] ring-1 ring-[#f0d48a]",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[#e0a106]" />
      {attentionLabel(attention)}
    </span>
  );
}

export function AttentionDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2.5 shrink-0", className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#e0a106] opacity-75" />
      <span className="relative size-2.5 rounded-full bg-[#e0a106]" />
    </span>
  );
}
