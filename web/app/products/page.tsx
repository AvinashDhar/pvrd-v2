import { filterCatalogue, publicCategories } from "@/lib/catalogue";
import { PageHero } from "@/components/catalogue/page-hero";
import { ProductCard } from "@/components/catalogue/product-card";

export default async function PublicProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const [items, categories] = await Promise.all([
    filterCatalogue({ q, category }),
    publicCategories(),
  ]);
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
            : "Browse door fittings, aldrops, handles and kitchen hardware. MRP is public — sign in for trade price."
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No fittings match that search. Try a brand, SKU or category name.</p>
      ) : null}
    </main>
  );
}
