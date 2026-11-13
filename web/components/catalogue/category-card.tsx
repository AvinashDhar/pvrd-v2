import Link from "next/link";
import { MediaImage } from "@/components/catalogue/media-image";
import { cn } from "@/lib/utils";

export function CategoryCard({
  name,
  products,
  image,
  href = "/products",
  className,
}: {
  name: string;
  products: number;
  image: string;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("pvrd-card group block", className)}>
      <MediaImage
        src={image}
        alt=""
        className="aspect-[5/4] sm:aspect-[4/3]"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        imageClassName="transition-transform duration-500 group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#001F3D]/80 via-[#001F3D]/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
        <h2 className="font-heading text-sm font-semibold tracking-tight text-white sm:text-base">
          {name}
        </h2>
        <p className="mt-0.5 text-xs text-white/75">{products} products</p>
      </div>
    </Link>
  );
}
