import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { rasterizeImage, mapLimited } from "@/lib/catalogues/images";
import { computeDisplayRate } from "@/lib/catalogue/fields";
import { getCategory } from "@/lib/catalogue/queries";
import { getCompanySettings } from "@/lib/db/company";
import { db } from "@/lib/db";
import { brands, productImages, productVariants, products } from "@/lib/db/schema";
import { fallbackImage } from "@/lib/media";

const skippedFields = new Set([
  "image",
  "brand",
  "name",
  "sku",
  "mrp",
  "price",
  "contractorDiscount",
  "consumerDiscount",
  "points",
  "description",
  "size",
  "finish",
]);

export type CataloguePdfProduct = {
  name: string;
  brand: string;
  sku: string;
  size: string;
  finishes: string;
  price: string;
  description: string;
  features: { label: string; value: string }[];
  variants: { name: string; finish: string; size: string; price: string }[];
  image: string | null;
};

export type CataloguePdfModel = {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logo: string | null;
  categoryName: string;
  generatedAt: Date;
  products: CataloguePdfProduct[];
};

export async function buildCataloguePdf(categoryId: string): Promise<{ model: CataloguePdfModel } | { error: string }> {
  const category = await getCategory(categoryId);
  if (!category) return { error: "Category was not found." };

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      price: products.price,
      description: products.description,
      attributes: products.attributes,
      brandName: brands.name,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(and(eq(products.categoryId, categoryId), eq(products.status, "active")))
    .orderBy(asc(products.name));

  if (rows.length === 0) {
    return { error: "Add an active product in this category before generating a catalogue." };
  }

  const ids = rows.map((row) => row.id);
  const [imageRows, variantRows, company] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(and(inArray(productImages.productId, ids), isNull(productImages.variantId)))
      .orderBy(desc(productImages.isPrimary), productImages.sortOrder),
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, ids))
      .orderBy(productVariants.sortOrder),
    getCompanySettings(),
  ]);

  const imageByProduct = new Map<string, string>();
  for (const image of imageRows) {
    if (image.productId && image.url !== fallbackImage && !imageByProduct.has(image.productId)) {
      imageByProduct.set(image.productId, image.url);
    }
  }

  const variantsByProduct = new Map<string, typeof variantRows>();
  for (const variant of variantRows) {
    const list = variantsByProduct.get(variant.productId) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.productId, list);
  }

  const drafts = rows.map((row) => {
    const attributes = Object.fromEntries(
      Object.entries((row.attributes ?? {}) as Record<string, unknown>)
        .filter(([key]) => !key.startsWith("_"))
        .map(([key, value]) => [key, text(value)]),
    );
    const variants = (variantsByProduct.get(row.id) ?? []).map((variant) => ({
      name: variant.name,
      finish: variant.finish?.trim() || "",
      size: variant.size?.trim() || "",
      price: pdfMoney(variant.price ?? row.price),
    }));
    const finishes = unique([attributes.finish ?? "", ...variants.map((variant) => variant.finish)]);
    const sizes = unique([attributes.size ?? "", ...variants.map((variant) => variant.size)]);
    const features = category.fields.flatMap((field) => {
      if (skippedFields.has(field.key) || field.type === "image") return [];
      const value = attributes[field.key]?.trim();
      if (!value) return [];
      const label = field.group ? `${field.group} · ${field.label}` : field.label;
      return [{ label, value }];
    });
    for (const rate of category.displayRates) {
      const value = computeDisplayRate(rate.keys, attributes);
      if (!value) continue;
      features.push({ label: rate.label, value: rate.formula ? `${value} (${rate.formula})` : value });
    }
    return {
      name: row.name,
      brand: row.brandName?.trim() || "",
      sku: row.sku?.trim() || "",
      size: sizes.slice(0, 4).join(", "),
      finishes: finishes.join(", "),
      price: pdfMoney(row.price),
      description: (row.description ?? "").trim().slice(0, 500),
      features: features.slice(0, 12),
      variants: variants.slice(0, 24),
      imageUrl: imageByProduct.get(row.id) ?? null,
    };
  });

  const [logo, images] = await Promise.all([
    rasterizeImage(company.logoUrl, 280),
    mapLimited(drafts, 4, (draft) => rasterizeImage(draft.imageUrl, 360)),
  ]);

  return {
    model: {
      companyName: company.companyName,
      tagline: company.tagline,
      email: company.email,
      phone: company.phone,
      website: company.website.replace(/^https?:\/\//, ""),
      address: company.address,
      logo,
      categoryName: category.name,
      generatedAt: new Date(),
      products: drafts.map((draft, index) => ({
        name: draft.name,
        brand: draft.brand,
        sku: draft.sku,
        size: draft.size,
        finishes: draft.finishes,
        price: draft.price,
        description: draft.description,
        features: draft.features,
        variants: draft.variants,
        image: images[index],
      })),
    },
  };
}

function pdfMoney(value: string | number | null) {
  const amount = Number(value ?? 0);
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number.isFinite(amount) ? amount : 0,
  );
  return `Rs ${formatted}`;
}

function text(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value.trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}
