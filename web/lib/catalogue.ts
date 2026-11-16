import { fallbackImage } from "@/lib/media";
import { computeDisplayRate } from "@/lib/catalogue/fields";
import { countProducts, getCategory, getProduct, listProducts, publicCatalogue } from "@/lib/catalogue/queries";

export async function publicCategories() {
  const { categories } = await publicCatalogue();
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    products: category.productCount,
    image: category.imageUrl || fallbackImage,
    status: category.status,
  }));
}

export const cataloguePageSize = 24;
export const catalogueBatchSize = 100;

const publicList = { status: "active" as const, categoryStatus: "active" as const };

export async function publicProductTotal() {
  return countProducts(publicList);
}

export async function featuredPublicProducts(limit = 8) {
  const rows = await listProducts({ ...publicList, sort: "created", dir: "desc", limit, offset: 0 });
  return rows.map(toCard);
}

export async function pageCatalogue({
  q,
  category,
  sort = "relevance",
  trade = false,
  limit,
  offset,
}: {
  q?: string;
  category?: string;
  sort?: "relevance" | "name" | "price-asc" | "price-desc";
  trade?: boolean;
  limit: number;
  offset: number;
}) {
  const categories = await publicCategories();
  const match = category
    ? categories.find((item) => item.slug === category || item.name.toLowerCase() === category.toLowerCase())
    : undefined;
  if (category && !match) return { items: [], total: 0 };

  const filters = {
    ...publicList,
    q,
    categoryId: match?.id,
    ...catalogueSort(sort, trade),
  };
  const [rows, total] = await Promise.all([
    listProducts({ ...filters, limit, offset }),
    countProducts(filters),
  ]);
  return { items: rows.map(toCard), total };
}

export async function relatedPublicProducts(categoryId: string, excludeId: string) {
  const shared = { ...publicList, excludeId, sort: "created", dir: "desc" as const, limit: 3, offset: 0 };
  const sameCategory = await listProducts({ ...shared, categoryId });
  const rows = sameCategory.length ? sameCategory : await listProducts(shared);
  return rows.map(toCard);
}

function catalogueSort(sort: "relevance" | "name" | "price-asc" | "price-desc", trade: boolean) {
  if (sort === "name") return { sort: "name", dir: "asc" as const };
  if (sort === "price-asc" || sort === "price-desc") {
    return { sort: trade ? "price" : "mrp", dir: sort === "price-asc" ? ("asc" as const) : ("desc" as const) };
  }
  return { sort: "created", dir: "desc" as const };
}

export async function publicBrands() {
  const { brands } = await publicCatalogue();
  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    products: brand.productCount,
    categories: brand.categoryNames,
    image: brand.logoUrl || fallbackImage,
  }));
}


export async function getPublicProduct(id: string) {
  const product = await getProduct(id);
  if (!product || product.status !== "active" || product.categoryStatus !== "active") return null;
  const category = await getCategory(product.categoryId);
  const labels = new Map(
    (category?.fields ?? []).map((field) => [field.key, field.group ? `${field.group} · ${field.label}` : field.label]),
  );
  return {
    ...toCard({
      ...product,
      brandName: product.brandName,
      categoryName: product.categoryName,
      image: product.image,
    }),
    categoryId: product.categoryId,
    sku: product.sku || "",
    description: product.description,
    attributes: product.attributes,
    categorySlug: product.categorySlug,
    specs: Object.entries(product.attributes).map(([key, value]) => ({
      key,
      label: labels.get(key) ?? key,
      value,
    })),
    displayRates: (category?.displayRates ?? []).map((rate) => ({
      label: rate.label,
      formula: rate.formula,
      value: computeDisplayRate(rate.keys, product.attributes),
    })),
    images: product.images.map((image) => image.url),
    variants: product.variants.map((variant) => {
      const stored = (variant.attributes ?? {}) as Record<string, unknown>;
      const text = (key: string) => {
        const value = stored[key];
        return value == null || value === "" ? null : String(value);
      };
      return {
        id: variant.id,
        name: variant.name,
        finish: variant.finish,
        size: variant.size,
        price: variant.price,
        image: variant.imageUrl,
        mrp: text("mrp") ?? "",
        points: text("points") ?? "",
        packing: text("Packing") ?? text("packing"),
        unit: text("Unit") ?? text("unit"),
      };
    }),
  };
}

function toCard(product: {
  id: string;
  name: string;
  brandName: string | null;
  categoryName: string;
  price: string;
  mrp: string;
  image: string;
  sku?: string | null;
  categorySlug?: string;
}) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brandName || "",
    category: product.categoryName,
    categorySlug: product.categorySlug || "",
    price: Number(product.price),
    mrp: Number(product.mrp),
    image: product.image,
    sku: product.sku || "",
  };
}
