import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProduct, publicProducts } from "@/lib/catalogue";
import { recordProductEvent } from "@/lib/analytics";
import { getUserSession } from "@/lib/auth/session";
import { formatINR } from "@/lib/format";
import { isTradeAccount, moneyAmount } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/catalogue/product-card";
import { MediaImage } from "@/components/catalogue/media-image";

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, account] = await Promise.all([getPublicProduct(id), getUserSession()]);
  if (!product) notFound();
  const trade = isTradeAccount(account?.userType);
  await recordProductEvent("view", [id]);
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

      <section className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="pvrd-card overflow-hidden">
          <MediaImage
            src={product.image}
            alt={product.name}
            fit="contain"
            className="aspect-[4/3] bg-white lg:aspect-square"
            sizes="(max-width: 1024px) 100vw, 50vw"
            imageClassName="p-[8%] sm:p-[10%]"
            priority
          />
        </div>
        <div className="pvrd-card flex flex-col overflow-hidden">
          <div className="bg-[#001F3D] px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-xs font-medium tracking-[0.14em] text-white/70 uppercase">{product.category}</p>
            <h1 className="mt-1 font-heading text-2xl leading-tight font-semibold tracking-tight text-white sm:text-3xl">{product.name}</h1>
            <p className="mt-1 text-sm text-white/70 sm:text-base">{product.brand} · {product.sku || "No SKU"}</p>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <p className="font-heading text-2xl font-semibold text-white sm:text-3xl">{formatINR(trade ? product.price : product.mrp)}</p>
              <p className="text-sm text-white/70 sm:text-base">{trade ? `Trade price · MRP ${formatINR(product.mrp)}` : "MRP"}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
          {product.description ? <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p> : null}
          {product.displayRates.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {product.displayRates.map((rate) => (
                <div key={rate.label} className="rounded-2xl bg-muted/70 px-4 py-3">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{rate.label}</p>
                  <p className="mt-1 text-base font-semibold">{rate.value ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{rate.formula}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {product.specs.map((spec) => (
              <div key={spec.label} className="rounded-2xl bg-muted/70 px-4 py-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{spec.label}</p>
                <p className="mt-1 text-base font-semibold">{spec.value}</p>
              </div>
            ))}
          </div>
          {product.variants.length > 0 ? (
            <div className="mt-6 grid gap-3 md:hidden">
              {product.variants.map((variant) => (
                <div key={`${variant.name}-${variant.size}-${variant.finish}`} className="rounded-2xl bg-muted/70 px-4 py-3">
                  <p className="text-base font-semibold">{variant.name}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div><dt className="text-muted-foreground">Finish</dt><dd>{variant.finish || "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Size</dt><dd>{variant.size || "—"}</dd></div>
                    <div><dt className="text-muted-foreground">MRP</dt><dd>{variant.mrp ? formatINR(variant.mrp) : "—"}</dd></div>
                    {trade ? (
                      <div>
                        <dt className="text-muted-foreground">Trade price</dt>
                        <dd>{formatINR(moneyAmount(variant.price) ?? product.price)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ))}
            </div>
          ) : null}
          {product.variants.length > 0 ? (
            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    {["Variant", "Finish", "Size", "MRP", ...(trade ? ["Trade price"] : []), "Points"].map((column) => (
                      <th key={column} className="py-2 pr-3 font-medium">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => (
                    <tr key={`${variant.name}-${variant.size}-${variant.finish}`} className="border-t border-border">
                      <td className="py-2 pr-3 font-medium">{variant.name}</td>
                      <td className="py-2 pr-3">{variant.finish || "—"}</td>
                      <td className="py-2 pr-3">{variant.size || "—"}</td>
                      <td className="py-2 pr-3">{variant.mrp ? formatINR(variant.mrp) : "—"}</td>
                      {trade ? <td className="py-2 pr-3">{formatINR(moneyAmount(variant.price) ?? product.price)}</td> : null}
                      <td className="py-2 pr-3">{variant.points || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {trade ? null : account ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Trade price is for retailer and carpenter accounts. This is a consumer account.
            </p>
          ) : (
            <div className="mt-6">
              <Button render={<Link href={`/login?next=${encodeURIComponent(`/products/${product.id}`)}`} />} size="lg" className="h-12 w-full sm:w-auto">
                Sign in for trade price
              </Button>
            </div>
          )}
          </div>
        </div>
      </section>

      {more.length ? (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold text-primary">You may also like</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {more.map((item) => (
              <ProductCard key={item.id} product={item} trade={trade} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
