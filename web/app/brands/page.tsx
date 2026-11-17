import { publicBrands } from "@/lib/catalogue";
import { getUserSession } from "@/lib/auth/session";
import { GuestOffer } from "@/components/catalogue/account-benefits";
import { PageHero } from "@/components/catalogue/page-hero";
import { BrandCard } from "@/components/catalogue/brand-card";

export default async function PublicBrandsPage() {
  const [brands, account] = await Promise.all([publicBrands(), getUserSession()]);
  return (
    <main className="pvrd-page">
      <PageHero
        title="Brands"
        description="Logos, ranges and product counts from the live catalogue."
      />
      {account ? null : (
        <div className="mt-5">
          <GuestOffer next="/brands" />
        </div>
      )}
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
