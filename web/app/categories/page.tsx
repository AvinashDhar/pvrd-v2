import { publicCategories } from "@/lib/catalogue";
import { getUserSession } from "@/lib/auth/session";
import { GuestOffer } from "@/components/catalogue/account-benefits";
import { PageHero } from "@/components/catalogue/page-hero";
import { CategoryCard } from "@/components/catalogue/category-card";

export default async function PublicCategoriesPage() {
  const [categories, account] = await Promise.all([publicCategories(), getUserSession()]);
  return (
    <main className="pvrd-page">
      <PageHero
        title="Categories"
        description="Find the right hardware family, then jump into products and catalogues."
      />
      {account ? null : (
        <div className="mt-5">
          <GuestOffer next="/categories" />
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            name={category.name}
            products={category.products}
            image={category.image}
            href={`/products?category=${category.slug}`}
          />
        ))}
      </div>
    </main>
  );
}
