import Image from "next/image";
import { cn } from "@/lib/utils";

export function MediaImage({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
  fit = "cover",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  sizes?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#e8f0f6]", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        quality={75}
        className={cn(fit === "contain" ? "object-contain p-[12%]" : "object-cover", imageClassName)}
      />
    </div>
  );
}
