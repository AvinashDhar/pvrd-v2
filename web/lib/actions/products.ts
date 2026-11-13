"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, newId, productImages, productVariants, products } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { getCategory, getProduct } from "@/lib/catalogue/queries";
import { removeStoredImage, storeImage } from "@/lib/storage/images";

function refresh(id?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/categories");
  revalidatePath("/brands");
  revalidatePath("/");
  if (id) {
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/products/${id}`);
  }
}

type VariantInput = {
  id?: string;
  name?: string;
  finish?: string;
  size?: string;
  price?: string;
  copyPrice?: boolean;
  attributes?: Record<string, string>;
};

type ImageInput = { id: string; isPrimary?: boolean };

function money(value: FormDataEntryValue | null) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return number.toFixed(2);
}

export async function saveProduct(_previous: { error: string } | null, formData: FormData) {
  const session = await getAdminSession();
  if (!session) return { error: "Sign in again." };

  const id = String(formData.get("id") ?? "");
  const current = id ? await getProduct(id) : null;
  if (id && !current) return { error: "Product was not found." };

  const category = await getCategory(String(formData.get("categoryId") ?? ""));
  if (!category) return { error: "Choose a category." };
  const switchingToClosed = !current || current.categoryId !== category.id;
  if (switchingToClosed && category.status !== "active") {
    return { error: "Hidden categories cannot take new products." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const mrp = money(formData.get("mrp"));
  const price = money(formData.get("price"));
  if (!name) return { error: "Product name is required." };
  if (!mrp || !price) return { error: "MRP and price are required." };

  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) return { error: "Choose a brand." };

  let attributes: Record<string, string> = {};
  try {
    const parsed = JSON.parse(String(formData.get("attributes") ?? "{}"));
    if (parsed && typeof parsed === "object") {
      attributes = Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value ?? "")]),
      );
    }
  } catch {
    return { error: "Product specifications could not be read." };
  }

  for (const field of category.fields) {
    if (!field.required) continue;
    if (["image", "brand", "name", "sku", "mrp", "price", "contractorDiscount", "consumerDiscount", "points", "description"].includes(field.key)) {
      continue;
    }
    if (!attributes[field.key]?.trim()) return { error: `${field.label} is required.` };
  }

  const values = {
    categoryId: category.id,
    brandId,
    name,
    sku: String(formData.get("sku") ?? "").trim() || null,
    mrp,
    price,
    contractorDiscount: money(formData.get("contractorDiscount")),
    consumerDiscount: money(formData.get("consumerDiscount")),
    points: Number(formData.get("points") ?? 0) || 0,
    description: String(formData.get("description") ?? "").trim() || null,
    attributes,
    status: (["active", "inactive", "hidden"].includes(String(formData.get("status")))
      ? String(formData.get("status"))
      : "active") as "active" | "inactive" | "hidden",
    updatedAt: new Date(),
  };

  const productId = current?.id ?? newId();
  if (current) {
    await db.update(products).set(values).where(eq(products.id, productId));
  } else {
    await db.insert(products).values({ id: productId, ...values });
  }

  try {
    await syncImages(productId, formData, !current);
    await syncVariants(productId, formData, price);
  } catch (error) {
    if (!current) await discardProduct(productId);
    return { error: error instanceof Error ? error.message : "Image upload failed." };
  }

  const images = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(and(eq(productImages.productId, productId), isNull(productImages.variantId)));
  if (images.length === 0) {
    if (!current) await discardProduct(productId);
    return { error: "Upload at least one product image." };
  }

  await db.insert(activityLogs).values({
    title: `${session.name} ${current ? "updated" : "added"} product ${name}`,
    entityType: "product",
    entityId: productId,
  });
  refresh(productId);
  redirect(`/admin/products/${productId}`);
}

async function syncImages(productId: string, formData: FormData, isNew: boolean) {
  let existing: ImageInput[] = [];
  if (!isNew) {
    try {
      existing = JSON.parse(String(formData.get("existingImages") ?? "[]"));
    } catch {
      throw new Error("Existing images could not be read.");
    }
  }

  const current = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.productId, productId), isNull(productImages.variantId)));
  const keep = new Set(existing.map((image) => image.id));
  for (const image of current) {
    if (!keep.has(image.id)) {
      await removeStoredImage(image.url, image.objectKey);
      await db.delete(productImages).where(eq(productImages.id, image.id));
    }
  }

  let primaryAssigned = false;
  for (const [index, image] of existing.entries()) {
    const isPrimary = Boolean(image.isPrimary) && !primaryAssigned;
    if (isPrimary) primaryAssigned = true;
    await db
      .update(productImages)
      .set({ sortOrder: index, isPrimary })
      .where(eq(productImages.id, image.id));
  }

  const uploads = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
  const preferNew = formData.get("newPrimary") === "on" && uploads.length > 0;
  if (preferNew) {
    primaryAssigned = false;
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(and(eq(productImages.productId, productId), isNull(productImages.variantId)));
  }

  for (const [index, file] of uploads.entries()) {
    const stored = await storeImage(file, { folder: "products", id: productId });
    const isPrimary = !primaryAssigned && (preferNew ? index === 0 : existing.length === 0 && index === 0);
    if (isPrimary) primaryAssigned = true;
    await db.insert(productImages).values({
      id: stored.id,
      productId,
      url: stored.url,
      objectKey: stored.key,
      sortOrder: existing.length + index,
      isPrimary,
    });
  }

  if (!primaryAssigned) {
    const [first] = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(and(eq(productImages.productId, productId), isNull(productImages.variantId)))
      .limit(1);
    if (first) await db.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, first.id));
  }
}

async function syncVariants(productId: string, formData: FormData, parentPrice: string) {
  let submitted: VariantInput[] = [];
  try {
    submitted = JSON.parse(String(formData.get("variants") ?? "[]"));
  } catch {
    throw new Error("Variants could not be read.");
  }
  if (!Array.isArray(submitted)) submitted = [];

  const current = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  const keep = new Set<string>();

  for (const [index, variant] of submitted.entries()) {
    const name = String(variant.name ?? "").trim();
    if (!name) continue;
    const copyPrice = Boolean(variant.copyPrice);
    const price = copyPrice ? parentPrice : money(variant.price ?? "") ?? parentPrice;
    const values = {
      name,
      finish: String(variant.finish ?? "").trim() || null,
      size: String(variant.size ?? "").trim() || null,
      price,
      copyPriceFromParent: copyPrice,
      attributes: variant.attributes ?? {},
      sortOrder: index,
    };
    let variantId = variant.id && current.some((row) => row.id === variant.id) ? variant.id : "";
    if (variantId) {
      await db.update(productVariants).set(values).where(eq(productVariants.id, variantId));
      keep.add(variantId);
    } else {
      variantId = newId();
      await db.insert(productVariants).values({ id: variantId, ...values, productId });
      keep.add(variantId);
    }

    const file = formData.get(`variantImage_${index}`);
    if (file instanceof File && file.size > 0) {
      const previous = await db.select().from(productImages).where(eq(productImages.variantId, variantId));
      for (const image of previous) {
        await removeStoredImage(image.url, image.objectKey);
        await db.delete(productImages).where(eq(productImages.id, image.id));
      }
      const stored = await storeImage(file, { folder: "variants", productId, id: variantId });
      await db.insert(productImages).values({
        id: stored.id,
        productId,
        variantId,
        url: stored.url,
      objectKey: stored.key,
        sortOrder: 0,
        isPrimary: true,
      });
    }
  }

  for (const variant of current) {
    if (!keep.has(variant.id)) {
      const images = await db.select().from(productImages).where(eq(productImages.variantId, variant.id));
      for (const image of images) await removeStoredImage(image.url, image.objectKey);
      await db.delete(productVariants).where(eq(productVariants.id, variant.id));
    }
  }
}

export async function setProductStatus(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const product = await getProduct(id);
  if (!product || !["active", "hidden"].includes(status)) redirect("/admin/products");
  await db
    .update(products)
    .set({ status: status as "active" | "hidden", updatedAt: new Date() })
    .where(eq(products.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} set ${product.name} to ${status}`,
    entityType: "product",
    entityId: id,
  });
  refresh(id);
  redirect(`/admin/products/${id}`);
}

async function discardProduct(productId: string) {
  const images = await db
    .select({ url: productImages.url, objectKey: productImages.objectKey })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  for (const image of images) await removeStoredImage(image.url, image.objectKey);
  await db.delete(products).where(eq(products.id, productId));
}

export async function deleteProduct(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const product = await getProduct(id);
  if (!product) redirect("/admin/products");
  await discardProduct(id);
  await db.insert(activityLogs).values({
    title: `${session.name} deleted product ${product.name}`,
    entityType: "product",
    entityId: id,
  });
  refresh(id);
  redirect("/admin/products");
}
