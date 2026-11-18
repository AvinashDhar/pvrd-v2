import { existsSync, readFileSync } from "node:fs";
import { resolveCatalogueDataFile, localCatalogueData } from "./local-assets";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq, inArray, or, sql } from "drizzle-orm";
import { loadEnvLocal } from "./load-env";

loadEnvLocal();

type CatalogueVariant = {
  name: string;
  size?: string | null;
  finish?: string | null;
  price: string;
  unit?: string | null;
  packing?: string | null;
};

type CatalogueProduct = {
  name: string;
  sku?: string | null;
  category: string;
  mrp: string;
  unit?: string | null;
  description: string;
  attributes: Record<string, string>;
  images: string[];
  variants: CatalogueVariant[];
};

type CatalogueFile = {
  source: string;
  brand: { name: string; description: string };
  products: CatalogueProduct[];
};

function r2() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("R2 environment variables are missing.");
  }
  return {
    bucket,
    publicUrl,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

async function main() {
  const catalogue = JSON.parse(readFileSync(resolveCatalogueDataFile("products-100.json"), "utf8")) as CatalogueFile;
  const storage = r2();
  const { db } = await import("./index");
  const { activityLogs, brandCategories, brands, categories, newId, productImages, productVariants, products } = await import("./schema");
  const { builtinFieldSchema, categorySchemas } = await import("../categories/field-schemas");
  const { imageForCategory } = await import("../media");

  for (const schema of categorySchemas) {
    const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, schema.slug)).limit(1);
    if (existing) continue;
    await db.insert(categories).values({
      name: schema.name,
      slug: schema.slug,
      imageUrl: imageForCategory(schema.slug),
      description: null,
      status: "active",
      fieldSchema: builtinFieldSchema(schema),
      variantSchema: schema.variantFields,
    });
  }

  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));
  for (const product of catalogue.products) {
    if (!categoryIds.has(product.category)) {
      throw new Error(`No category for ${product.name}: ${product.category}`);
    }
  }

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
  }
  if (!brand) throw new Error("PVRD brand could not be saved.");

  const names = catalogue.products.map((product) => product.name);
  const skus = catalogue.products.map((product) => product.sku).filter((sku): sku is string => Boolean(sku));
  const previous = await db
    .select({ id: products.id })
    .from(products)
    .where(
      or(
        sql`json_unquote(json_extract(${products.attributes}, '$._source')) = 'catalogue-2025'`,
        inArray(products.name, names),
        skus.length ? inArray(products.sku, skus) : sql`0`,
      ),
    );
  if (previous.length) {
    await db.delete(products).where(inArray(products.id, previous.map((row) => row.id)));
  }

  const fileCache = new Map<string, Buffer>();
  async function upload(relativePath: string, productId: string) {
    let body = fileCache.get(relativePath);
    if (!body) {
      const local = localCatalogueData(relativePath);
      const legacy = resolve(process.cwd(), "data", relativePath);
      const path = existsSync(local) ? local : legacy;
      body = readFileSync(path);
      fileCache.set(relativePath, body);
    }
    const imageId = randomUUID();
    const key = `products/${productId}/${imageId}.jpg`;
    await storage.client.send(
      new PutObjectCommand({
        Bucket: storage.bucket,
        Key: key,
        Body: body,
        ContentType: "image/jpeg",
      }),
    );
    return { url: `${storage.publicUrl}/${key}`, key };
  }

  let images = 0;
  let variants = 0;
  const usedCategories = new Set<string>();

  for (const item of catalogue.products) {
    const categoryId = categoryIds.get(item.category);
    if (!categoryId) throw new Error(`Missing category ${item.category}`);
    const productId = newId();
    const storedImages = [];
    for (const relativePath of item.images) {
      storedImages.push(await upload(relativePath, productId));
      images += 1;
    }
    await db.insert(products).values({
      id: productId,
      categoryId,
      brandId: brand.id,
      name: item.name,
      sku: item.sku || null,
      mrp: item.mrp,
      price: item.mrp,
      description: item.description,
      attributes: item.attributes,
      points: 0,
      status: "active",
    });
    await db.insert(productImages).values(
      storedImages.map((image, index) => ({
        productId,
        url: image.url,
        objectKey: image.key,
        sortOrder: index,
        isPrimary: index === 0,
      })),
    );
    if (item.variants.length) {
      await db.insert(productVariants).values(
        item.variants.map((variant, index) => ({
          productId,
          name: variant.name,
          size: variant.size || null,
          finish: variant.finish || null,
          price: variant.price,
          copyPriceFromParent: false,
          attributes: {
            mrp: variant.price,
            ...(variant.unit ? { Unit: variant.unit } : {}),
            ...(variant.packing ? { Packing: variant.packing } : {}),
          },
          sortOrder: index,
        })),
      );
      variants += item.variants.length;
    }
    usedCategories.add(categoryId);
  }

  await db.delete(brandCategories).where(eq(brandCategories.brandId, brand.id));
  if (usedCategories.size) {
    await db.insert(brandCategories).values([...usedCategories].map((categoryId) => ({ brandId: brand.id, categoryId })));
  }
  await db.insert(activityLogs).values({
    title: `Imported ${catalogue.products.length} products from the 2025 catalogue`,
    entityType: "catalogue",
    entityId: "catalogue-2025",
  });

  console.log(`Removed ${previous.length} earlier rows`);
  console.log(`Imported ${catalogue.products.length} products`);
  console.log(`Uploaded ${images} images`);
  console.log(`Saved ${variants} variants`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
