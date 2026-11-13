import { fallbackImage } from "@/lib/media";
import { getProduct, listProducts, publicCatalogue } from "@/lib/catalogue/queries";

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

export async function publicProducts() {
  const { products } = await publicCatalogue();
  return products.map(toCard);
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

export async function filterCatalogue({
  q,
  category,
}: {
  q?: string;
  category?: string;
}) {
  const categories = await publicCategories();
  const match = category
    ? categories.find((item) => item.slug === category || item.name.toLowerCase() === category.toLowerCase())
    : undefined;
  if (category && !match) return [];

  const rows = await listProducts({
    status: "active",
    q,
    categoryId: match?.id,
  });
  const visible = new Set(categories.map((item) => item.id));
  return rows.filter((product) => visible.has(product.categoryId)).map(toCard);
}

export async function getPublicProduct(id: string) {
  const product = await getProduct(id);
  if (!product || product.status !== "active" || product.categoryStatus !== "active") return null;
  return {
    ...toCard({
      ...product,
      brandName: product.brandName,
      categoryName: product.categoryName,
      image: product.image,
    }),
    sku: product.sku || "",
    description: product.description,
    attributes: product.attributes,
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
    price: Number(product.price),
    mrp: Number(product.mrp),
    image: product.image,
    sku: product.sku || "",
  };
}
