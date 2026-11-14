"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, catalogues, categories, newId, products } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { normalizeFields, readDisplayRates, slugify } from "@/lib/catalogue/fields";
import { BUILTIN_SCHEMA_VERSION } from "@/lib/categories/field-schemas";
import { getCategory } from "@/lib/catalogue/queries";
import { removeStoredImage, storeImage } from "@/lib/storage/images";
import { removeStoredPdf } from "@/lib/storage/objects";
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
  const displayRates = readDisplayRates({ displayRates: readJson(formData, "displayRates") });
  const displayFormula = displayRates.map((rate) => rate.formula).join(" · ")
    || String(formData.get("displayFormula") ?? "").trim();
  if (!name) return formError("Category name is required.", "name");
  if (name.length > 160) return formError("Name must be 160 characters or fewer.", "name");
  if (description.length > 2000) return formError("Description must be 2000 characters or fewer.", "description");
  if (!["active", "inactive", "hidden"].includes(status)) return formError("Choose a valid status.", "status");

  const current = id ? await getCategory(id) : null;
  if (id && !current) return formError("Category was not found.");

  const fields = normalizeFields(readJson(formData, "fields"));
  const variantFields = normalizeFields(readJson(formData, "variantFields"), false);

  if (current) {
    const removed = current.fields.filter((field) => !fields.some((item) => item.key === field.key));
    if (removed.length > 0) {
      const rows = await db
        .select({ attributes: products.attributes })
        .from(products)
        .where(eq(products.categoryId, current.id));
      const used = new Set(rows.flatMap((row) => Object.keys((row.attributes ?? {}) as object)));
      const blocked = removed.find((field) => used.has(field.key));
      if (blocked) {
        return formError(`${blocked.label} is already used by products, so it cannot be removed.`, "fields");
      }
    }
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
      displayFormula: displayFormula || undefined,
      displayRates,
    },
    variantSchema: variantFields,
  };

  const previousImage = current?.imageUrl ?? null;

  if (current) {
    await db.update(categories).set(values).where(eq(categories.id, categoryId));
    if (previousImage && previousImage !== imageUrl) await removeStoredImage(previousImage, current.imageKey);
    await db.insert(activityLogs).values({
      title: `${session.name} updated category ${name}`,
      entityType: "category",
      entityId: categoryId,
    });
    refresh();
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
  redirect(`/admin/categories/${categoryId}`);
}

export async function setCategoryStatus(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "hidden"].includes(status)) redirect("/admin/categories");
  const category = await getCategory(id);
  if (!category) redirect("/admin/categories");
  await db.update(categories).set({ status: status as "active" | "hidden" }).where(eq(categories.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} set ${category.name} to ${status}`,
    entityType: "category",
    entityId: id,
  });
  refresh();
  redirect(`/admin/categories/${id}`);
}

export async function deleteCategory(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const category = await getCategory(id);
  if (!category) redirect("/admin/categories");
  const [total] = await db.select({ total: count() }).from(products).where(eq(products.categoryId, id));
  if ((total?.total ?? 0) > 0) {
    redirect(`/admin/categories/${id}?error=${encodeURIComponent("This category still has products, so it cannot be deleted. Hide it instead.")}`);
  }
  await removeStoredImage(category.imageUrl, category.imageKey);
  const files = await db.select().from(catalogues).where(eq(catalogues.categoryId, id));
  for (const file of files) await removeStoredPdf(file.pdfKey);
  await db.delete(catalogues).where(eq(catalogues.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} deleted category ${category.name}`,
    entityType: "category",
    entityId: id,
  });
  refresh();
  redirect("/admin/categories");
}
