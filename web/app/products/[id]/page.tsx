import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProduct, publicProducts } from "@/lib/catalogue";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/catalogue/product-card";
import { MediaImage } from "@/components/catalogue/media-image";

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getPublicProduct(id);
  if (!product) notFound();
  const catalogue = await publicProducts();
  const related = catalogue.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
  const more = related.length ? related : catalogue.filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <main className="pvrd-page">
      <p className="text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-primary">Products</Link>
        <span className="mx-2">/</span>
        <span>{product.category}</span>
      </p>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_1.05fr] lg:items-start">
        <div className="pvrd-card overflow-hidden">
          <MediaImage
            src={product.image}
            alt={product.name}
            className="aspect-square sm:aspect-[4/3] lg:aspect-square"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="pvrd-card p-5 sm:p-7">
          <p className="pvrd-kicker">{product.category}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-primary">{product.name}</h1>
          <p className="mt-1 text-muted-foreground">{product.brand} · {product.sku || "No SKU"}</p>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <p className="font-heading text-3xl font-semibold">{formatINR(product.price)}</p>
            <p className="text-sm text-muted-foreground">MRP {formatINR(product.mrp)}</p>
          </div>
          {product.description ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p> : null}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(product.attributes).slice(0, 6).map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-muted/70 px-3 py-3">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button render={<Link href="/login" />} size="lg" className="h-11">Sign in for trade price</Button>
          </div>
        </div>
      </section>

      {more.length ? (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold text-primary">You may also like</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
