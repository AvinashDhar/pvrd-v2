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
  sku?: string;
};

export const productGridClassName = "grid grid-cols-2 items-start gap-x-2.5 gap-y-3.5 sm:items-stretch sm:gap-4";

export function ProductCard({
  product,
  href,
  trade = false,
  badge,
  className,
}: {
  product: ProductCardProduct;
  href?: string;
  trade?: boolean;
  badge?: string;
  className?: string;
}) {
  const destination = href ?? `/products/${product.id}`;
  const amount = trade ? product.price : product.mrp;
  const pricedApart = trade && product.mrp > product.price;
  const discount = pricedApart && product.mrp > 0 ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const subtitle = product.sku?.trim() || product.category;
  const tag = product.category.replace(/[^a-zA-Z0-9]+/g, "");

  return (
    <Link
      href={destination}
      className={cn(
        "pvrd-card group flex h-full min-w-0 flex-col max-sm:rounded-lg max-sm:shadow-none max-sm:ring-1 max-sm:ring-[#e6e6e6]",
        className,
      )}
    >
      <div className="relative">
        <MediaImage
          src={product.image}
          alt={product.name}
          fit="contain"
          className="aspect-square bg-[#f7f8fa] sm:aspect-[5/4] sm:bg-white lg:aspect-[4/3]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          imageClassName="p-[8%] transition-transform duration-500 group-hover:scale-[1.04] sm:p-[12%]"
        />
        {badge ? (
          <span className="absolute top-2 left-2 rounded-full bg-lime px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-2 pt-2 pb-2.5 sm:hidden">
        <h2 className="line-clamp-2 text-[13px] leading-[1.25] text-[#222]">
          {product.brand ? <span className="font-bold text-primary">{product.brand} </span> : null}
          <span className="font-medium">{product.name}</span>
        </h2>
        <p className="mt-0.5 truncate text-[11px] text-[#8a9199]">{subtitle}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {discount > 0 ? <span className="text-[12px] font-semibold text-[#078a4c]">↓{discount}%</span> : null}
          {pricedApart ? <span className="text-[12px] text-[#9aa0a6] line-through">{formatINR(product.mrp)}</span> : null}
          <span className="text-[15px] leading-none font-bold text-[#222]">{formatINR(amount)}</span>
          <span className="text-[10px] font-medium tracking-wide text-[#8b93a0] uppercase">{trade ? "Trade" : "MRP"}</span>
        </div>
        {tag && product.sku?.trim() ? (
          <p className="mt-auto truncate pt-1 text-[12px] font-semibold text-[#3d4f63]">#{tag}</p>
        ) : null}
      </div>
      <div className="hidden flex-1 flex-col bg-[#001F3D] px-3.5 py-3 sm:flex lg:px-4">
        <p className="truncate text-xs font-medium tracking-[0.12em] text-white/70 uppercase">{product.category}</p>
        <h2 className="mt-1 line-clamp-2 font-heading text-base leading-snug font-semibold tracking-tight text-white lg:text-lg">
          {product.name}
        </h2>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <p className="font-heading text-base font-semibold text-white lg:text-lg">{formatINR(amount)}</p>
          <p className="text-xs font-medium tracking-wide text-white/55 uppercase">{trade ? "Trade" : "MRP"}</p>
          {pricedApart ? <p className="text-xs text-white/55 line-through lg:text-sm">{formatINR(product.mrp)}</p> : null}
        </div>
      </div>
    </Link>
  );
}
