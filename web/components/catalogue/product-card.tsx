import Link from "next/link";
import { formatINR } from "@/lib/format";
import { MediaImage } from "@/components/catalogue/media-image";
import { cn } from "@/lib/utils";

type ProductCardProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  image: string;
};

export function ProductCard({
  product,
  href,
  trade = false,
  className,
}: {
  product: ProductCardProduct;
  href?: string;
  trade?: boolean;
  className?: string;
}) {
  const destination = href ?? `/products/${product.id}`;
  const amount = trade ? product.price : product.mrp;
  const pricedApart = trade && product.mrp > product.price;

  return (
    <Link href={destination} className={cn("pvrd-card group flex h-full flex-col", className)}>
      <MediaImage
        src={product.image}
        alt={product.name}
        fit="contain"
        className="aspect-[4/3] bg-white sm:aspect-[5/4] lg:aspect-[4/3]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        imageClassName="p-[8%] transition-transform duration-500 group-hover:scale-[1.04] sm:p-[12%]"
      />
      <div className="flex flex-1 flex-col bg-[#001F3D] px-4 py-3.5 sm:px-3.5 sm:py-3 lg:px-4">
        <p className="truncate text-xs font-medium tracking-[0.12em] text-white/70 uppercase">
          {product.category}
        </p>
        <h2 className="mt-1 line-clamp-2 font-heading text-lg leading-snug font-semibold tracking-tight text-white sm:text-base lg:text-lg">
          {product.name}
        </h2>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <p className="font-heading text-lg font-semibold text-white sm:text-base lg:text-lg">{formatINR(amount)}</p>
          <p className="text-xs font-medium tracking-wide text-white/55 uppercase">{trade ? "Trade" : "MRP"}</p>
          {trade && product.mrp !== product.price ? (
            <p className={cn("text-sm text-white/55 sm:text-xs lg:text-sm", pricedApart && "line-through")}>{formatINR(product.mrp)}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
