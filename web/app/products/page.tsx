import { filterCatalogue, publicCategories } from "@/lib/catalogue";
import { getUserSession } from "@/lib/auth/session";
import { isTradeAccount } from "@/lib/pricing";
import { PageHero } from "@/components/catalogue/page-hero";
import { ProductCard } from "@/components/catalogue/product-card";

export default async function PublicProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const [items, categories, account] = await Promise.all([
    filterCatalogue({ q, category }),
    publicCategories(),
    getUserSession(),
  ]);
  const trade = isTradeAccount(account?.userType);
  const activeCategory = categories.find(
    (item) => item.slug === category || item.name.toLowerCase() === category?.toLowerCase(),
  );

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
                ? "MRP is shown on this consumer account. Trade price is for retailer and carpenter accounts."
                : "Browse door fittings, aldrops, handles and kitchen hardware. MRP is public — sign in for trade price."
        }
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} trade={trade} />
        ))}
      </div>
      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No fittings match that search. Try a brand, SKU or category name.</p>
      ) : null}
    </main>
  );
}
