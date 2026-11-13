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
  className,
}: {
  product: ProductCardProduct;
  href?: string;
  className?: string;
}) {
  const destination = href ?? `/products/${product.id}`;
  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <Link href={destination} className={cn("pvrd-card group flex flex-col", className)}>
      <div className="relative">
        <MediaImage
          src={product.image}
          alt={product.name}
          className="aspect-[4/3]"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {discount > 0 ? (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
            {discount}% off
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {product.category}
        </p>
        <h2 className="mt-1 font-heading text-base font-semibold tracking-tight text-primary group-hover:text-[#002C54]">
          {product.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{product.brand}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-4">
          <p className="font-heading text-lg font-semibold">{formatINR(product.price)}</p>
          {product.mrp > product.price ? (
            <p className="text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</p>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">MRP shown · Sign in for trade price</p>
      </div>
    </Link>
  );
}
