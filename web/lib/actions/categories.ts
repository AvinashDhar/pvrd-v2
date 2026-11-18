"use server";

import { count, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, catalogues, categories, newId, productImages, productVariants, products } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { fieldChangeError, normalizeFields, slugify } from "@/lib/catalogue/fields";
import { BUILTIN_SCHEMA_VERSION } from "@/lib/categories/field-schemas";
import { getCategory } from "@/lib/catalogue/queries";
import { removeStoredImage, storeImage } from "@/lib/storage/images";
import { removeStoredPdf } from "@/lib/storage/objects";
import { flash } from "@/lib/flash";
import { formError } from "@/lib/forms";

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

async function uniqueSlug(name: string, currentId?: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (true) {
    const [hit] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
    if (!hit || hit.id === currentId) return slug;
    slug = `${base}-${suffix++}`;
  }
}

function addStored(bucket: Record<string, string[]>, key: string, value: unknown) {
  if (!key || key.startsWith("_")) return;
  const text = String(value ?? "").trim();
  if (!text) return;
  if (key === "points" && Number(text) === 0) return;
  bucket[key] ??= [];
  bucket[key].push(text);
}

function addAttributes(bucket: Record<string, string[]>, value: unknown) {
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) addStored(bucket, key, item);
}

async function storedFieldValues(categoryId: string) {
  const productRows = await db
    .select({
      id: products.id,
      sku: products.sku,
      price: products.price,
      contractorDiscount: products.contractorDiscount,
      consumerDiscount: products.consumerDiscount,
      points: products.points,
      description: products.description,
      brandId: products.brandId,
      attributes: products.attributes,
    })
    .from(products)
    .where(eq(products.categoryId, categoryId));
  const productsUsed: Record<string, string[]> = {};
  const variantsUsed: Record<string, string[]> = {};
  if (productRows.length === 0) return { products: productsUsed, variants: variantsUsed };

  const ids = productRows.map((row) => row.id);
  const [imageRows, variantRows] = await Promise.all([
    db
      .select({ variantId: productImages.variantId })
      .from(productImages)
      .where(inArray(productImages.productId, ids)),
    db
      .select({
        id: productVariants.id,
        name: productVariants.name,
        finish: productVariants.finish,
        size: productVariants.size,
        price: productVariants.price,
        attributes: productVariants.attributes,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, ids)),
  ]);
  const hasProductImage = imageRows.some((row) => !row.variantId);
  const variantsWithImages = new Set(imageRows.flatMap((row) => (row.variantId ? [row.variantId] : [])));

  for (const row of productRows) {
    addStored(productsUsed, "sku", row.sku);
    addStored(productsUsed, "price", row.price);
    addStored(productsUsed, "contractorDiscount", row.contractorDiscount);
    addStored(productsUsed, "consumerDiscount", row.consumerDiscount);
    addStored(productsUsed, "points", row.points);
    addStored(productsUsed, "description", row.description);
    addStored(productsUsed, "brand", row.brandId);
    addAttributes(productsUsed, row.attributes);
  }
  if (hasProductImage) addStored(productsUsed, "image", "image");

  for (const row of variantRows) {
    addStored(variantsUsed, "name", row.name);
    addStored(variantsUsed, "finish", row.finish);
    addStored(variantsUsed, "size", row.size);
    addStored(variantsUsed, "price", row.price);
    addAttributes(variantsUsed, row.attributes);
    if (variantsWithImages.has(row.id)) addStored(variantsUsed, "image", "image");
  }
  return { products: productsUsed, variants: variantsUsed };
}

function readJson(formData: FormData, key: string) {
  try {
    return JSON.parse(String(formData.get(key) ?? "[]"));
  } catch {
    return [];
  }
}

export async function saveCategory(_previous: { error: string; field?: string } | null, formData: FormData) {
  const session = await getAdminSession();
  if (!session) return formError("Sign in again.");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  if (!name) return formError("Category name is required.", "name");
  if (name.length > 160) return formError("Name must be 160 characters or fewer.", "name");
  if (description.length > 2000) return formError("Description must be 2000 characters or fewer.", "description");
  if (!["active", "inactive", "hidden"].includes(status)) return formError("Choose a valid status.", "status");

  const current = id ? await getCategory(id) : null;
  if (id && !current) return formError("Category was not found.");

  const fields = normalizeFields(readJson(formData, "fields"));
  const variantFields = normalizeFields(readJson(formData, "variantFields"), false);

  if (current) {
    const stored = await storedFieldValues(current.id);
    const fieldError = fieldChangeError(current.fields, fields, stored.products);
    if (fieldError) return formError(fieldError, "fields");
    const variantError = fieldChangeError(current.variantFields, variantFields, stored.variants);
    if (variantError) return formError(variantError, "variantFields");
  }

  const categoryId = current?.id ?? newId();
  let imageUrl = current?.imageUrl ?? null;
  let imageKey = current?.imageKey ?? null;
  const image = formData.get("image");
  const removeImage = formData.get("removeImage") === "1";
  if (image instanceof File && image.size > 0) {
    try {
      const stored = await storeImage(image, { folder: "categories", id: categoryId });
      imageUrl = stored.url;
      imageKey = stored.key;
    } catch (error) {
      return formError(error instanceof Error ? error.message : "Image upload failed.", "image");
    }
  } else if (removeImage) {
    imageUrl = null;
    imageKey = null;
  }
  if (!current && !imageUrl) return formError("A category image is required.", "image");

  const values = {
    name,
    description: description || null,
    status: status as "active" | "hidden" | "inactive",
    imageUrl,
    imageKey,
    fieldSchema: {
      schemaVersion: BUILTIN_SCHEMA_VERSION,
      fields,
    },
    variantSchema: variantFields,
  };

  const previousImage = current?.imageUrl ?? null;

  if (current) {
    await db.update(categories).set(values).where(eq(categories.id, categoryId));
    if (previousImage && previousImage !== imageUrl) {
      try {
        await removeStoredImage(previousImage, current.imageKey);
      } catch {
        // Keep the category save even if the old R2 object cannot be deleted.
      }
    }
    await db.insert(activityLogs).values({
      title: `${session.name} updated category ${name}`,
      entityType: "category",
      entityId: categoryId,
    });
    refresh();
    await flash("success", "Category updated.");
    redirect(`/admin/categories/${categoryId}`);
  }

  const slug = await uniqueSlug(name);
  await db.insert(categories).values({ id: categoryId, ...values, slug });
  await db.insert(activityLogs).values({
    title: `${session.name} added category ${name}`,
    entityType: "category",
    entityId: categoryId,
  });
  refresh();
  await flash("success", "Category added.");
  redirect(`/admin/categories/${categoryId}`);
}

export async function setCategoryStatus(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "hidden"].includes(status)) return { error: "Choose a valid status." };
  const category = await getCategory(id);
  if (!category) return { error: "That category is no longer available." };
  await db.update(categories).set({ status: status as "active" | "hidden" }).where(eq(categories.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} set ${category.name} to ${status}`,
    entityType: "category",
    entityId: id,
  });
  refresh();
  revalidatePath(`/admin/categories/${id}`);
  return { message: status === "active" ? `${category.name} is active.` : `${category.name} is hidden.` };
}

export async function deleteCategory(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const category = await getCategory(id);
  if (!category) {
    await flash("error", "That category is no longer available.");
    redirect("/admin/categories");
  }
  const [total] = await db.select({ total: count() }).from(products).where(eq(products.categoryId, id));
  if ((total?.total ?? 0) > 0) {
    return { error: "This category still has products, so it cannot be deleted. Hide it instead." };
  }
  await removeStoredImage(category.imageUrl, category.imageKey);
  const files = await db.select().from(catalogues).where(eq(catalogues.categoryId, id));
  await Promise.all(files.map((file) => removeStoredPdf(file.pdfKey)));
  await db.delete(catalogues).where(eq(catalogues.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} deleted category ${category.name}`,
    entityType: "category",
    entityId: id,
  });
  refresh();
  await flash("success", `${category.name} deleted.`);
  redirect("/admin/categories");
}
