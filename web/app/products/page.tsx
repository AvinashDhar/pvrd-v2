import Link from "next/link";
import { catalogueBatchSize, pageCatalogue, publicCategories } from "@/lib/catalogue";
import { getUserSession } from "@/lib/auth/session";
import { isTradeAccount } from "@/lib/pricing";
import { GuestOffer } from "@/components/catalogue/account-benefits";
import { PageHero } from "@/components/catalogue/page-hero";
import { CategoryCard } from "@/components/catalogue/category-card";
import { ProductListBar } from "@/components/catalogue/product-list-bar";
import { ProductStream } from "@/components/catalogue/product-stream";

export default async function PublicProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; subcategory?: string; sort?: string }>;
}) {
  const { q, category, subcategory, sort } = await searchParams;
  const [categories, account] = await Promise.all([publicCategories(), getUserSession()]);
  const trade = isTradeAccount(account?.userType);
  const activeCategory = categories.find(
    (item) => item.slug === category || item.name.toLowerCase() === category?.toLowerCase(),
  );
  const activeSubcategory = activeCategory?.subcategories.find(
    (item) => item.slug === subcategory || item.name.toLowerCase() === subcategory?.toLowerCase(),
  );
  const activeSort = sort === "price-asc" || sort === "price-desc" || sort === "name" ? sort : "relevance";
  const showSubcategoryCards = Boolean(activeCategory?.subcategories.length && !activeSubcategory && !q);
  const { items, total } = await pageCatalogue({
    q,
    category,
    subcategory: activeSubcategory?.slug,
    sort: activeSort,
    trade,
    limit: catalogueBatchSize,
    offset: 0,
  });

  const title = activeSubcategory?.name ?? activeCategory?.name ?? "Products";
  const scopeLabel = activeSubcategory
    ? `${activeCategory?.name} · ${activeSubcategory.name}`
    : activeCategory?.name;

  return (
    <main className="pvrd-page">
      <PageHero
        title={title}
        description={
          q
            ? `Results for “${q}”${scopeLabel ? ` in ${scopeLabel}` : ""}.`
            : showSubcategoryCards
              ? `Choose a group inside ${activeCategory?.name}, or browse every product in this category below.`
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
          categories={categories.map((item) => ({
            slug: item.slug,
            name: item.name,
            products: item.products,
            subcategories: item.subcategories,
          }))}
          query={q}
          category={activeCategory?.slug}
          subcategory={activeSubcategory?.slug}
          sort={activeSort}
        />

        {showSubcategoryCards && activeCategory ? (
          <div className="mt-5 px-4 sm:px-0">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="font-heading text-base font-semibold tracking-tight sm:text-lg">Subcategories</h2>
              <Link
                href={`/products?category=${activeCategory.slug}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                All products
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {activeCategory.subcategories.map((item) => (
                <CategoryCard
                  key={item.id}
                  name={item.name}
                  products={item.products}
                  image={item.image}
                  href={`/products?category=${activeCategory.slug}&subcategory=${item.slug}`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {activeSubcategory && activeCategory ? (
          <div className="mt-4 px-4 sm:px-0">
            <Link
              href={`/products?category=${activeCategory.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← All {activeCategory.name} groups
            </Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <ProductStream
            key={`${q ?? ""}|${category ?? ""}|${subcategory ?? ""}|${activeSort}|${trade ? "trade" : "mrp"}`}
            initialItems={items}
            total={total}
            trade={trade}
            query={q}
            category={category}
            subcategory={activeSubcategory?.slug}
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
