import { catalogueBatchSize, pageCatalogue, publicCategories } from "@/lib/catalogue";
import { getUserSession } from "@/lib/auth/session";
import { isTradeAccount } from "@/lib/pricing";
import { GuestOffer } from "@/components/catalogue/account-benefits";
import { PageHero } from "@/components/catalogue/page-hero";
import { ProductListBar } from "@/components/catalogue/product-list-bar";
import { ProductStream } from "@/components/catalogue/product-stream";

export default async function PublicProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;
  const [categories, account] = await Promise.all([publicCategories(), getUserSession()]);
  const trade = isTradeAccount(account?.userType);
  const activeCategory = categories.find(
    (item) => item.slug === category || item.name.toLowerCase() === category?.toLowerCase(),
  );
  const activeSort = sort === "price-asc" || sort === "price-desc" || sort === "name" ? sort : "relevance";
  const { items, total } = await pageCatalogue({
    q,
    category,
    sort: activeSort,
    trade,
    limit: catalogueBatchSize,
    offset: 0,
  });

  return (
    <main className="pvrd-page">
      <PageHero
        title={activeCategory ? activeCategory.name : "Products"}
        description={
          q
            ? `Results for “${q}”${activeCategory ? ` in ${activeCategory.name}` : ""}.`
            : trade
              ? "Trade prices are shown for this retailer or carpenter account. MRP stays on each product."
              : account
                ? "MRP is shown on this consumer account. Discounted trade price is for retailer, carpenter, and contractor accounts. You can still request a quotation and discuss it with OM PVRD."
                : "MRP is public. Sign in for the discounted trade price, to request a quotation, and to discuss it with OM PVRD."
        }
      />
      {account ? null : (
        <div className="mt-5">
          <GuestOffer next="/products" />
        </div>
      )}
      <div className="mt-5 -mx-4 sm:mx-0 sm:mt-8">
        <ProductListBar
          categories={categories.map((item) => ({ slug: item.slug, name: item.name, products: item.products }))}
          query={q}
          category={activeCategory?.slug}
          sort={activeSort}
        />
        {items.length > 0 ? (
          <ProductStream
            key={`${q ?? ""}|${category ?? ""}|${activeSort}|${trade ? "trade" : "mrp"}`}
            initialItems={items}
            total={total}
            trade={trade}
            query={q}
            category={category}
            sort={activeSort}
          />
        ) : (
          <p className="mt-8 px-4 text-sm text-muted-foreground sm:px-0">
            No fittings match that search. Try a name, SKU, description, finish, or size.
          </p>
        )}
      </div>
    </main>
  );
}
