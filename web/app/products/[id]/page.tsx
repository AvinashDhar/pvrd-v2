import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProduct, relatedPublicProducts } from "@/lib/catalogue";
import { recordProductEvent } from "@/lib/analytics";
import { getUserSession } from "@/lib/auth/session";
import { formatINR } from "@/lib/format";
import { isTradeAccount } from "@/lib/pricing";
import { ProductCard, productGridClassName } from "@/components/catalogue/product-card";
import { cn } from "@/lib/utils";
import { ProductGallery } from "@/components/catalogue/product-gallery";
import { ProductVariants } from "@/components/catalogue/product-variants";
import { AccountBenefits } from "@/components/catalogue/account-benefits";
import { AddToQuotation } from "@/components/catalogue/add-to-quotation";

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
  const more = await relatedPublicProducts(product.categoryId, product.id);

  return (
    <main className="pvrd-page">
      <p className="text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-primary">Products</Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${product.categorySlug}`} className="hover:text-primary">
          {product.category}
        </Link>
        {product.subcategory && product.subcategorySlug ? (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/products?category=${product.categorySlug}&subcategory=${product.subcategorySlug}`}
              className="hover:text-primary"
            >
              {product.subcategory}
            </Link>
          </>
        ) : null}
      </p>

      <section className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
        <ProductGallery
          images={product.images.length > 0 ? product.images : [product.image]}
          alt={product.name}
        />
        <div className="pvrd-card flex flex-col overflow-hidden">
          <div className="bg-[#001F3D] px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-xs font-medium tracking-[0.14em] text-white/70 uppercase">
              {product.subcategory ? `${product.category} · ${product.subcategory}` : product.category}
            </p>
            <h1 className="mt-1 font-heading text-2xl leading-tight font-semibold tracking-tight text-white sm:text-3xl">{product.name}</h1>
            <p className="mt-1 text-sm text-white/70 sm:text-base">{product.brand} · {product.sku || "No SKU"}</p>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <p className="font-heading text-2xl font-semibold text-white sm:text-3xl">{formatINR(trade ? product.price : product.mrp)}</p>
              <p className="text-sm text-white/70 sm:text-base">{trade ? `Trade price · MRP ${formatINR(product.mrp)}` : "MRP"}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
          {product.description ? <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p> : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {product.specs.map((spec) => (
              <div key={spec.label} className="rounded-2xl bg-muted/70 px-4 py-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{spec.label}</p>
                <p className="mt-1 text-base font-semibold">{spec.value}</p>
              </div>
            ))}
          </div>
          <ProductVariants variants={product.variants} trade={trade} productPrice={product.price} />
          {trade ? null : account ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Discounted trade price is for retailer, carpenter, and contractor accounts. This consumer account sees MRP. You can still request a quotation and discuss it with OM PVRD.
            </p>
          ) : (
            <div className="mt-6">
              <AccountBenefits showActions next={`/products/${product.id}`} />
            </div>
          )}
          {account ? (
            <AddToQuotation
              productId={product.id}
              returnTo={`/products/${product.id}`}
              options={product.variants.flatMap((variant) =>
                variant.id
                  ? [{ id: variant.id, label: [variant.size, variant.finish].filter(Boolean).join(" · ") || variant.name }]
                  : [],
              )}
            />
          ) : null}
          </div>
        </div>
      </section>

      {more.length ? (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold text-primary">You may also like</h2>
          <div className={cn(productGridClassName, "mt-5 lg:grid-cols-3")}>
            {more.map((item) => (
              <ProductCard key={item.id} product={item} trade={trade} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
