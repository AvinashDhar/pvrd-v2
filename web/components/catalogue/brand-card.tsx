import Link from "next/link";
import { MediaImage } from "@/components/catalogue/media-image";
import { productCount } from "@/lib/format";
import { fallbackImage } from "@/lib/media";
import { cn } from "@/lib/utils";

export function BrandCard({
  name,
  products,
  categories,
  image,
  className,
}: {
  name: string;
  products: number;
  categories?: string[];
  image: string;
  className?: string;
}) {
  const ranges = categories?.slice(0, 2).join(", ");
  const extra = categories && categories.length > 2 ? ` +${categories.length - 2}` : "";
  const logo = image !== fallbackImage;

  return (
    <Link
      href={`/products?q=${encodeURIComponent(name)}`}
      className={cn("pvrd-card group flex h-full flex-col", className)}
    >
      <MediaImage
        src={image}
        alt=""
        fit={logo ? "contain" : "cover"}
        className="aspect-[4/3] bg-white sm:aspect-[5/4] lg:aspect-[4/3]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="bg-[#001F3D] px-4 py-3.5 sm:px-3.5 sm:py-3 lg:px-4">
        <h2 className="truncate font-heading text-lg leading-snug font-semibold tracking-tight text-white sm:text-base lg:text-lg">
          {name}
        </h2>
        <p className="mt-1 truncate text-sm text-white/75 sm:text-xs lg:text-sm">
          {productCount(products)}
          {ranges ? ` · ${ranges}${extra}` : ""}
        </p>
      </div>
    </Link>
  );
}
