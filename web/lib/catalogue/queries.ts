import { type AnyColumn, and, count, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brandCategories,
  brands,
  categories,
  productImages,
  productVariants,
  products,
} from "@/lib/db/schema";
import { fallbackImage } from "@/lib/media";
import { readFields, readFormula, readVariantFields } from "@/lib/catalogue/fields";

function contains(column: AnyColumn, value: string) {
  const term = `%${value.replace(/[%_]/g, "").toLowerCase()}%`;
  return sql`lower(${column}) like ${term}`;
}

export async function listCategories() {
  const rows = await db.select().from(categories).orderBy(categories.name);
  const totals = await db
    .select({ categoryId: products.categoryId, total: count() })
    .from(products)
    .groupBy(products.categoryId);
  const counts = new Map(totals.map((row) => [row.categoryId, row.total]));

  return rows.map((row) => ({
    ...row,
    productCount: counts.get(row.id) ?? 0,
    fields: readFields(row.fieldSchema),
    displayFormula: readFormula(row.fieldSchema),
    variantFields: readVariantFields(row.variantSchema),
  }));
}

export async function getCategory(id: string) {
  const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!row) return null;
  const [total] = await db
    .select({ total: count() })
    .from(products)
    .where(eq(products.categoryId, id));
  return {
    ...row,
    productCount: total?.total ?? 0,
    fields: readFields(row.fieldSchema),
    displayFormula: readFormula(row.fieldSchema),
    variantFields: readVariantFields(row.variantSchema),
  };
}

export async function listBrands(filters?: { q?: string; status?: string; categoryId?: string }) {
  const conditions = [];
  const q = filters?.q?.trim();
  if (q) conditions.push(contains(brands.name, q));
  if (filters?.status && filters.status !== "all") conditions.push(eq(brands.status, filters.status as "active"));
  if (filters?.categoryId) {
    const links = await db
      .select({ brandId: brandCategories.brandId })
      .from(brandCategories)
      .where(eq(brandCategories.categoryId, filters.categoryId));
    const ids = links.map((link) => link.brandId);
    if (ids.length === 0) return [];
    conditions.push(inArray(brands.id, ids));
  }

  const rows = await db
    .select()
    .from(brands)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(brands.name);

  return attachBrandMeta(rows);
}

async function attachBrandMeta<T extends { id: string }>(rows: T[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const links = await db
    .select({
      brandId: brandCategories.brandId,
      categoryId: categories.id,
      categoryName: categories.name,
    })
    .from(brandCategories)
    .innerJoin(categories, eq(brandCategories.categoryId, categories.id))
    .where(inArray(brandCategories.brandId, ids));
  const totals = await db
    .select({ brandId: products.brandId, total: count() })
    .from(products)
    .where(inArray(products.brandId, ids))
    .groupBy(products.brandId);
  const names = new Map<string, string[]>();
  for (const link of links) {
    const current = names.get(link.brandId) ?? [];
    current.push(link.categoryName);
    names.set(link.brandId, current);
  }
  const counts = new Map(totals.map((row) => [row.brandId, row.total]));
  return rows.map((row) => ({
    ...row,
    categoryNames: names.get(row.id) ?? [],
    categoryIds: links.filter((link) => link.brandId === row.id).map((link) => link.categoryId),
    productCount: counts.get(row.id) ?? 0,
  }));
}

export async function getBrand(id: string) {
  const [row] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  if (!row) return null;
  const [enriched] = await attachBrandMeta([row]);
  return enriched;
}

export type ProductFilters = {
  q?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
};

export async function listProducts(filters: ProductFilters = {}) {
  const conditions = [];
  const q = filters.q?.trim();
  if (q) {
    conditions.push(or(contains(products.name, q), contains(products.sku, q), contains(categories.name, q), contains(brands.name, q)));
  }
  if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters.brandId) conditions.push(eq(products.brandId, filters.brandId));
  if (filters.status && filters.status !== "all") conditions.push(eq(products.status, filters.status as "active"));
  if (filters.minPrice) conditions.push(gte(products.price, filters.minPrice));
  if (filters.maxPrice) conditions.push(lte(products.price, filters.maxPrice));

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      mrp: products.mrp,
      price: products.price,
      status: products.status,
      createdAt: products.createdAt,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      brandId: products.brandId,
      brandName: brands.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt));

  const images = await primaryImageMap(rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, image: images.get(row.id) ?? fallbackImage }));
}

export async function productStats() {
  const [totals] = await db
    .select({
      total: count(),
      active: sql<number>`coalesce(sum(case when ${products.status} = 'active' then 1 else 0 end), 0)`,
      hidden: sql<number>`coalesce(sum(case when ${products.status} = 'hidden' then 1 else 0 end), 0)`,
      thisMonth: sql<number>`coalesce(sum(case when ${products.createdAt} >= date_format(utc_timestamp(), '%Y-%m-01') then 1 else 0 end), 0)`,
    })
    .from(products);
  return {
    total: Number(totals?.total ?? 0),
    active: Number(totals?.active ?? 0),
    hidden: Number(totals?.hidden ?? 0),
    thisMonth: Number(totals?.thisMonth ?? 0),
  };
}

export async function getProduct(id: string) {
  const [row] = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      brandId: products.brandId,
      name: products.name,
      sku: products.sku,
      mrp: products.mrp,
      price: products.price,
      contractorDiscount: products.contractorDiscount,
      consumerDiscount: products.consumerDiscount,
      points: products.points,
      description: products.description,
      attributes: products.attributes,
      status: products.status,
      createdAt: products.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryStatus: categories.status,
      brandName: brands.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.id, id))
    .limit(1);
  if (!row) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.productId, id), isNull(productImages.variantId)))
    .orderBy(productImages.sortOrder);
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(productVariants.sortOrder);

  return {
    ...row,
    attributes: Object.fromEntries(
      Object.entries((row.attributes ?? {}) as Record<string, string>).filter(([key]) => !key.startsWith("_")),
    ),
    images,
    variants,
    image: images.find((image) => image.isPrimary)?.url ?? images[0]?.url ?? fallbackImage,
  };
}

async function primaryImageMap(ids: string[]) {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const rows = await db
    .select()
    .from(productImages)
    .where(and(inArray(productImages.productId, ids), isNull(productImages.variantId)))
    .orderBy(desc(productImages.isPrimary), productImages.sortOrder);
  for (const row of rows) {
    if (row.productId && !map.has(row.productId)) map.set(row.productId, row.url);
  }
  return map;
}

export async function publicCatalogue() {
  const [categoryRows, productRows, brandRows] = await Promise.all([
    listCategories(),
    listProducts({ status: "active" }),
    listBrands({ status: "active" }),
  ]);
  const visibleCategories = categoryRows.filter((category) => category.status === "active");
  const visibleIds = new Set(visibleCategories.map((category) => category.id));
  const visibleProducts = productRows.filter((product) => visibleIds.has(product.categoryId));
  return { categories: visibleCategories, products: visibleProducts, brands: brandRows };
}
