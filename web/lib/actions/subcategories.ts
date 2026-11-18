"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, newId, productImages, productVariants, products, subcategories } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { fieldChangeError, normalizeFields, slugify } from "@/lib/catalogue/fields";
import { BUILTIN_SCHEMA_VERSION } from "@/lib/categories/field-schemas";
import { getCategory, getSubcategory } from "@/lib/catalogue/queries";
import { removeStoredImage, storeImage } from "@/lib/storage/images";
import type { SubcategoryDraftInput } from "@/lib/catalogue/subcategory-drafts";
import { flash } from "@/lib/flash";
import { formError } from "@/lib/forms";
import { validateImageFile } from "@/lib/storage/upload-limits";

function refresh(categoryId: string) {
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath("/admin/products");
  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

async function uniqueSubcategorySlug(categoryId: string, name: string, currentId?: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (true) {
    const [hit] = await db
      .select({ id: subcategories.id })
      .from(subcategories)
      .where(and(eq(subcategories.categoryId, categoryId), eq(subcategories.slug, slug)))
      .limit(1);
    if (!hit || hit.id === currentId) return slug;
    slug = `${base}-${suffix++}`;
  }
}

export async function insertSubcategoryDraft(
  categoryId: string,
  draft: SubcategoryDraftInput,
  actorName: string,
) {
  const subcategoryId = newId();
  const fields = normalizeFields(draft.fields);
  const variantFields = normalizeFields(draft.variantFields, false);
  const stored = await storeImage(draft.image!, { folder: "subcategories", id: subcategoryId });
  const slug = await uniqueSubcategorySlug(categoryId, draft.name);

  await db.insert(subcategories).values({
    id: subcategoryId,
    categoryId,
    slug,
    name: draft.name,
    description: draft.description || null,
    status: draft.status as "active" | "hidden",
    sortOrder: draft.sortOrder,
    imageUrl: stored.url,
    imageKey: stored.key,
    fieldSchema: {
      schemaVersion: BUILTIN_SCHEMA_VERSION,
      fields,
    },
    variantSchema: variantFields,
  });
  await db.insert(activityLogs).values({
    title: `${actorName} added subcategory ${draft.name}`,
    entityType: "subcategory",
    entityId: subcategoryId,
  });
  return subcategoryId;
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

async function storedFieldValues(subcategoryId: string) {
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
    .where(eq(products.subcategoryId, subcategoryId));
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

export async function saveSubcategory(_previous: { error: string; field?: string } | null, formData: FormData) {
  const session = await getAdminSession();
  if (!session) return formError("Sign in again.");

  const id = String(formData.get("id") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  const category = await getCategory(categoryId);
  if (!category) return formError("Choose a category.", "categoryId");
  if (!name) return formError("Subcategory name is required.", "name");
  if (name.length > 160) return formError("Name must be 160 characters or fewer.", "name");
  if (description.length > 2000) return formError("Description must be 2000 characters or fewer.", "description");
  if (!["active", "hidden"].includes(status)) return formError("Choose a valid status.", "status");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000) {
    return formError("Sort order must be a whole number from 0 to 10000.", "sortOrder");
  }

  const current = id ? await getSubcategory(id) : null;
  if (id && !current) return formError("Subcategory was not found.");
  if (current && current.categoryId !== categoryId) {
    return formError("Subcategories cannot move to another category.", "categoryId");
  }

  const fields = normalizeFields(readJson(formData, "fields"));
  const variantFields = normalizeFields(readJson(formData, "variantFields"), false);

  if (current) {
    const stored = await storedFieldValues(current.id);
    const fieldError = fieldChangeError(current.fields, fields, stored.products);
    if (fieldError) return formError(fieldError, "fields");
    const variantError = fieldChangeError(current.variantFields, variantFields, stored.variants);
    if (variantError) return formError(variantError, "variantFields");
  }

  const subcategoryId = current?.id ?? newId();
  let imageUrl = current?.imageUrl ?? null;
  let imageKey = current?.imageKey ?? null;
  const image = formData.get("image");
  const removeImage = formData.get("removeImage") === "1";
  if (image instanceof File && image.size > 0) {
    const imageInvalid = validateImageFile(image);
    if (imageInvalid) return formError(imageInvalid, "image");
    try {
      const stored = await storeImage(image, { folder: "subcategories", id: subcategoryId });
      imageUrl = stored.url;
      imageKey = stored.key;
    } catch (error) {
      return formError(error instanceof Error ? error.message : "Image upload failed.", "image");
    }
  } else if (removeImage) {
    imageUrl = null;
    imageKey = null;
  }
  if (!current && !imageUrl) return formError("A subcategory image is required.", "image");

  const values = {
    name,
    description: description || null,
    status: status as "active" | "hidden",
    sortOrder,
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
    await db.update(subcategories).set(values).where(eq(subcategories.id, current.id));
    if (previousImage && previousImage !== imageUrl) {
      try {
        await removeStoredImage(previousImage, current.imageKey);
      } catch {
        // Keep the subcategory save even if the old R2 object cannot be deleted.
      }
    }
    await db.insert(activityLogs).values({
      title: `${session.name} updated subcategory ${name}`,
      entityType: "subcategory",
      entityId: current.id,
    });
    refresh(categoryId);
    await flash("success", "Subcategory updated.");
    redirect(`/admin/categories/${categoryId}`);
  }

  const slug = await uniqueSubcategorySlug(categoryId, name);
  await db.insert(subcategories).values({
    id: subcategoryId,
    categoryId,
    slug,
    ...values,
  });
  await db.insert(activityLogs).values({
    title: `${session.name} added subcategory ${name}`,
    entityType: "subcategory",
    entityId: subcategoryId,
  });
  refresh(categoryId);
  await flash("success", "Subcategory added.");
  redirect(`/admin/categories/${categoryId}`);
}

export async function setSubcategoryStatus(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "hidden"].includes(status)) return { error: "Choose a valid status." };
  const subcategory = await getSubcategory(id);
  if (!subcategory) return { error: "That subcategory is no longer available." };
  await db.update(subcategories).set({ status: status as "active" | "hidden" }).where(eq(subcategories.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} set ${subcategory.name} to ${status}`,
    entityType: "subcategory",
    entityId: id,
  });
  refresh(subcategory.categoryId);
  return { message: status === "active" ? `${subcategory.name} is active.` : `${subcategory.name} is hidden.` };
}

export async function deleteSubcategory(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const subcategory = await getSubcategory(id);
  if (!subcategory) {
    await flash("error", "That subcategory is no longer available.");
    redirect("/admin/categories");
  }

  // Keep products; only clear the optional subcategory link.
  await db.update(products).set({ subcategoryId: null }).where(eq(products.subcategoryId, id));
  await db.delete(subcategories).where(eq(subcategories.id, id));
  try {
    await removeStoredImage(subcategory.imageUrl, subcategory.imageKey);
  } catch {
    // Subcategory row is already gone; orphaned media can be cleaned later.
  }
  await db.insert(activityLogs).values({
    title: `${session.name} deleted subcategory ${subcategory.name}`,
    entityType: "subcategory",
    entityId: id,
  });
  refresh(subcategory.categoryId);
  await flash("success", `${subcategory.name} deleted. Linked products stayed in the parent category.`);
  redirect(`/admin/categories/${subcategory.categoryId}`);
}

export async function resolveProductSubcategory(
  categoryId: string,
  subcategoryIdRaw: string,
  currentId?: string | null,
): Promise<{ ok: true; subcategoryId: string | null } | { ok: false; error: string }> {
  const subcategoryId = subcategoryIdRaw.trim();
  if (!subcategoryId) return { ok: true, subcategoryId: null };
  const subcategory = await getSubcategory(subcategoryId);
  if (!subcategory || subcategory.categoryId !== categoryId) {
    return { ok: false, error: "Choose a subcategory that belongs to this category." };
  }
  const switching = currentId !== subcategory.id;
  if (switching && subcategory.status !== "active") {
    return { ok: false, error: "Hidden subcategories cannot take new products." };
  }
  return { ok: true, subcategoryId: subcategory.id };
}
