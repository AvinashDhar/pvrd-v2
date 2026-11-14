import { publicCategories } from "@/lib/catalogue";
import { PageHero } from "@/components/catalogue/page-hero";
import { CategoryCard } from "@/components/catalogue/category-card";

export default async function PublicCategoriesPage() {
  const categories = await publicCategories();
  return (
    <main className="pvrd-page">
      <PageHero
        title="Categories"
        description="Find the right hardware family, then jump into products and catalogues."
      />
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
