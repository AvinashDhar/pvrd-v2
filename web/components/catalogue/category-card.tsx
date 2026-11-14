import Link from "next/link";
import { productCount } from "@/lib/format";
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
        className="aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        imageClassName="transition-transform duration-500 group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#001F3D]/85 via-[#001F3D]/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-3.5 lg:p-4">
        <h2 className="line-clamp-2 font-heading text-lg leading-snug font-semibold tracking-tight text-white sm:text-base lg:text-lg">
          {name}
        </h2>
        <p className="mt-1 text-sm text-white/80 sm:text-xs lg:text-sm">{productCount(products)}</p>
      </div>
    </Link>
  );
}
