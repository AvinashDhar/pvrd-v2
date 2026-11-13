import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { loadEnvLocal } from "./load-env";

loadEnvLocal();
process.env.PVRD_FORBID_R2 = "1";

type CatalogueVariant = {
  name: string;
  size?: string | null;
  finish?: string | null;
  price: number;
  unit?: string | null;
};

type CatalogueProduct = {
  name: string;
  sku?: string | null;
  category: string;
  mrp: number;
  unit?: string | null;
  image: string;
  page: number;
  status?: "active" | "hidden";
  variants: CatalogueVariant[];
  attributes: Record<string, string>;
};

type CatalogueFile = {
  source: string;
  brand: { name: string; description: string };
  products: CatalogueProduct[];
};

function money(value: number) {
  return value.toFixed(2);
}

function publicFile(url: string) {
  if (!url.startsWith("/") || url.includes("..")) return false;
  return existsSync(resolve(process.cwd(), "public", decodeURIComponent(url.slice(1))));
}

async function main() {
  const file = resolve(process.cwd(), "data/catalogue-2025.json");
  const catalogue = JSON.parse(readFileSync(file, "utf8")) as CatalogueFile;
  const matchesFile = resolve(process.cwd(), "data/marketing-matches.json");
  const marketing = existsSync(matchesFile)
    ? (JSON.parse(readFileSync(matchesFile, "utf8")) as { sku: string; image: string }[])
    : [];
  const extras = new Map<string, string[]>();
  for (const match of marketing) {
    const key = match.sku.toUpperCase();
    const current = extras.get(key) ?? [];
    if (!current.includes(match.image)) current.push(match.image);
    extras.set(key, current);
  }
  const { db } = await import("./index");
  const { activityLogs, brandCategories, brands, categories, newId, productImages, productVariants, products } = await import("./schema");
  const { categorySchemas } = await import("../categories/field-schemas");
  const { imageForCategory } = await import("../media");

  for (const schema of categorySchemas) {
    const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, schema.slug)).limit(1);
    if (existing) continue;
    await db.insert(categories).values({
      name: schema.name,
      slug: schema.slug,
      imageUrl: imageForCategory(schema.slug),
      description: schema.displayFormula ? `Display rate: ${schema.displayFormula}` : null,
      status: "active",
      fieldSchema: { fields: schema.fields, displayFormula: schema.displayFormula },
      variantSchema: schema.variantFields,
    });
  }

  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));

  let brand = (await db.select().from(brands).where(eq(brands.name, catalogue.brand.name)).limit(1))[0];
  if (!brand) {
    const brandId = newId();
    await db.insert(brands).values({
      id: brandId,
      name: catalogue.brand.name,
      description: catalogue.brand.description,
      status: "active",
    });
    brand = (await db.select().from(brands).where(eq(brands.id, brandId)).limit(1))[0];
  } else {
    await db.update(brands).set({ description: catalogue.brand.description, status: "active" }).where(eq(brands.id, brand.id));
  }
  if (!brand) throw new Error("Catalogue brand could not be saved.");

  const removed = await db
    .select({ id: products.id })
    .from(products)
    .where(sql`json_unquote(json_extract(${products.attributes}, '$._source')) = 'catalogue-2025'`);
  if (removed.length > 0) {
    await db.delete(products).where(inArray(products.id, removed.map((row) => row.id)));
  }

  let imported = 0;
  let skipped = 0;
  const usedCategories = new Set<string>();
  const categoryImage = new Map<string, string>();

  for (const item of catalogue.products) {
    const categoryId = categoryIds.get(item.category);
    if (!categoryId || !item.image || !publicFile(item.image)) {
      skipped += 1;
      continue;
    }
    const amount = money(item.mrp);
    const created = { id: newId() };
    await db.insert(products).values({
      id: created.id,
      categoryId,
      brandId: brand.id,
      name: item.name,
      sku: item.sku || null,
      mrp: amount,
      price: amount,
      description: item.status === "hidden" ? "Printed in the 2025 catalogue without a rate. Add the price before publishing." : null,
      attributes: { ...item.attributes, _source: "catalogue-2025" },
      status: item.status === "hidden" ? "hidden" : "active",
    });

    const gallery = [...(item.sku ? extras.get(item.sku.toUpperCase()) ?? [] : []), item.image].filter(
      (url, index, all) => publicFile(url) && all.indexOf(url) === index,
    );
    await db.insert(productImages).values(gallery.map((url, index) => ({
      productId: created.id,
      url,
      objectKey: null,
      sortOrder: index,
      isPrimary: index === 0,
    })));

    if (item.variants.length > 0) {
      await db.insert(productVariants).values(item.variants.map((variant, index) => ({
        productId: created.id,
        name: variant.name,
        size: variant.size || null,
        finish: variant.finish || null,
        price: money(variant.price),
        attributes: variant.unit ? { Unit: variant.unit } : {},
        sortOrder: index,
      })));
    }

    usedCategories.add(categoryId);
    if (item.status !== "hidden" && !categoryImage.has(categoryId)) categoryImage.set(categoryId, item.image);
    imported += 1;
  }

  const categoryRowsForImages = categoryImage.size
    ? await db
        .select({ id: categories.id, imageKey: categories.imageKey, imageUrl: categories.imageUrl })
        .from(categories)
        .where(inArray(categories.id, [...categoryImage.keys()]))
    : [];
  let categoryImagesUpdated = 0;
  for (const row of categoryRowsForImages) {
    const imageUrl = categoryImage.get(row.id);
    if (!imageUrl || row.imageKey || row.imageUrl === imageUrl) continue;
    await db.update(categories).set({ imageUrl, imageKey: null }).where(eq(categories.id, row.id));
    categoryImagesUpdated += 1;
  }

  await db.delete(brandCategories).where(eq(brandCategories.brandId, brand.id));
  if (usedCategories.size > 0) {
    await db.insert(brandCategories).values([...usedCategories].map((categoryId) => ({
      brandId: brand.id,
      categoryId,
    })));
  }

  await db.insert(activityLogs).values({
    title: `Imported ${imported} products from the 2025 catalogue`,
    entityType: "catalogue",
    entityId: "catalogue-2025",
  });

  console.log(`Removed ${removed.length} previous catalogue products`);
  console.log(`Imported ${imported} products from ${catalogue.source}`);
  console.log(`Skipped ${skipped} products with no local image`);
  console.log(`Updated ${categoryImagesUpdated} category images from local files`);
  console.log("Cloudflare R2 operations: 0");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
