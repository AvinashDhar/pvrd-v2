import { publicBrands } from "@/lib/catalogue";
import { PageHero } from "@/components/catalogue/page-hero";
import { BrandCard } from "@/components/catalogue/brand-card";

export default async function PublicBrandsPage() {
  const brands = await publicBrands();
  return (
    <main className="pvrd-page">
      <PageHero
        title="Brands"
        description="Logos, ranges and product counts from the live catalogue."
      />
      {brands.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No active brands yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              name={brand.name}
              products={brand.products}
              categories={brand.categories}
              image={brand.image}
            />
          ))}
        </div>
      )}
    </main>
  );
}
