import Image from "next/image";
import { cn } from "@/lib/utils";

const tones = [
  "from-[#003C6C] to-[#002C54]",
  "from-[#A3CB46] to-[#7FA82E]",
  "from-[#306084] to-[#003C6C]",
  "from-[#54789C] to-[#185478]",
  "from-[#8BB52E] to-[#5f7a18]",
  "from-[#0A4879] to-[#001F3D]",
];

export function ProductThumb({
  name,
  image,
  className,
}: {
  name: string;
  image?: string;
  className?: string;
}) {
  if (image) {
    return (
      <div className={cn("relative size-11 shrink-0 overflow-hidden rounded-xl bg-muted", className)}>
        <Image src={image} alt="" fill sizes="80px" className="object-cover" />
      </div>
    );
  }

  const tone = tones[name.length % tones.length];
  return (
    <div
      className={cn(
        "grid size-11 place-items-center rounded-2xl bg-linear-to-br text-[10px] font-bold tracking-wide text-white shadow-[0_8px_20px_rgba(0,44,84,0.18)]",
        tone,
        className,
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
