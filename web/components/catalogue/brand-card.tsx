import { MediaImage } from "@/components/catalogue/media-image";
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
  return (
    <article className={cn("pvrd-card overflow-hidden", className)}>
      <MediaImage
        src={image}
        alt=""
        className="aspect-[16/9]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="p-5">
        <h2 className="font-heading text-base font-semibold tracking-tight">{name}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{products} products</p>
        {categories?.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {category}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
