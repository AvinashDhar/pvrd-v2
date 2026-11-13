import Image from "next/image";
import { cn } from "@/lib/utils";

/** Transparent mark from public/logo.png (940×508). */
const LOGO_ASPECT = 940 / 508;

export function PvrdLogo({
  compact = false,
  inverted = false,
  className,
  size = 48,
}: {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
  size?: number;
}) {
  const height = size;
  const width = Math.round(size * LOGO_ASPECT);

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Image
        src="/logo.png"
        alt="OM PVRD"
        width={width}
        height={height}
        className={cn(
          "shrink-0 object-contain",
          inverted
            ? "[filter:drop-shadow(0_1px_2px_rgba(0,44,84,0.18))_drop-shadow(0_6px_14px_rgba(0,44,84,0.12))]"
            : "[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.55))_drop-shadow(0_4px_12px_rgba(0,0,0,0.35))]",
        )}
        style={{ width, height }}
        priority
      />
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p
            className={cn(
              "truncate font-heading text-sm font-semibold tracking-wide",
              inverted ? "text-primary" : "text-white",
            )}
          >
            OM PVRD
          </p>
          <p
            className={cn(
              "truncate text-[10px] tracking-[0.14em] uppercase",
              inverted ? "text-muted-foreground" : "text-white/60",
            )}
          >
            Premium Hardware Fittings
          </p>
        </div>
      )}
    </div>
  );
}
