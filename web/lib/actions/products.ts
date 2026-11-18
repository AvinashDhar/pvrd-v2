"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, newId, productImages, productVariants, products } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { getCategory, getProduct, getSubcategory } from "@/lib/catalogue/queries";
import { resolveProductSubcategory } from "@/lib/actions/subcategories";
import { markCataloguesStale } from "@/lib/catalogues/freshness";
import { removeStoredImage, storeImage } from "@/lib/storage/images";
import { collectProductUploadFiles, validateProductUploads } from "@/lib/storage/upload-limits";
import { flash } from "@/lib/flash";
import { formError } from "@/lib/forms";
import { pricingFieldHelp } from "@/lib/pricing";
import { announceProductLaunch, removeLaunchNotices } from "@/lib/launches";

function refresh(id?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/categories");
  revalidatePath("/brands");
  revalidatePath("/");
  revalidatePath("/notifications");
  if (id) {
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/products/${id}`);
  }
}

type VariantInput = {
  id?: string;
  hasImage?: boolean;
  values?: Record<string, string>;
  copy?: Record<string, boolean>;
};

type ImageInput = { id: string; isPrimary?: boolean };

function money(value: FormDataEntryValue | null, max = 9_999_999_999.99) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0 || number > max) return null;
  return number.toFixed(2);
}

export async function saveProduct(_previous: { error: string; field?: string } | null, formData: FormData) {
  const session = await getAdminSession();
  if (!session) return formError("Sign in again.");

  const id = String(formData.get("id") ?? "");
  const current = id ? await getProduct(id) : null;
  if (id && !current) return formError("Product was not found.");

  const category = await getCategory(String(formData.get("categoryId") ?? ""));
  if (!category) return formError("Choose a category.", "categoryId");
  const switchingToClosed = !current || current.categoryId !== category.id;
  if (switchingToClosed && category.status !== "active") {
    return formError("Hidden categories cannot take new products.", "categoryId");
  }
  const subcategoryResult = await resolveProductSubcategory(
    category.id,
    String(formData.get("subcategoryId") ?? ""),
    current?.subcategoryId,
  );
  if (!subcategoryResult.ok) {
    return formError(subcategoryResult.error, "subcategoryId");
  }
  const subcategory = subcategoryResult.subcategoryId
    ? await getSubcategory(subcategoryResult.subcategoryId)
    : null;
  const schemaFields = subcategory?.fields?.length ? subcategory.fields : category.fields;
  const schemaVariantFields = subcategory ? subcategory.variantFields : category.variantFields;

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const mrp = money(formData.get("mrp"));
  const priceText = String(formData.get("price") ?? "").trim();
  const price = money(formData.get("price"));
  if (!name) return formError("Product name is required.", "name");
  if (name.length > 255) return formError("Name must be 255 characters or fewer.", "name");
  if (sku.length > 64) return formError("SKU must be 64 characters or fewer.", "sku");
  if (!mrp) return formError("Enter an MRP of 0 or more.", "mrp");
  const priceField = schemaFields.find((field) => field.key === "price");
  const tradeLabel = pricingFieldHelp.price.label;
  if (priceText && !price) return formError(`Enter a valid ${tradeLabel.toLowerCase()}.`, "price");
  if (priceField?.required && !price) return formError(`${tradeLabel} is required.`, "price");
  const storedPrice = price ?? mrp;

  const brandField = schemaFields.find((field) => field.key === "brand");
  const brandId = String(formData.get("brandId") ?? "");
  if ((brandField?.required ?? true) && !brandId) return formError("Choose a brand.", "brandId");
  for (const key of ["contractorDiscount", "consumerDiscount"] as const) {
    const field = schemaFields.find((item) => item.key === key);
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) {
      if (field?.required) return formError(`${field.label} is required.`, key);
      continue;
    }
    if (!money(formData.get(key), 999.99)) return formError(`${field?.label ?? "Discount"} must be between 0 and 999.99.`, key);
  }
  const points = Number(formData.get("points") ?? 0);
  if (!Number.isInteger(points) || points < 0 || points > 1_000_000) {
    return formError("Points must be a whole number from 0 to 1000000.", "points");
  }
  const attributesText = String(formData.get("attributesText") ?? "").trim();
  if (attributesText.length > 4000) {
    return formError("Attributes must be 4000 characters or fewer.", "attributesText");
  }

  let attributes: Record<string, string> = {};
  try {
    const parsed = JSON.parse(String(formData.get("attributes") ?? "{}"));
    if (parsed && typeof parsed === "object") {
      attributes = Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value ?? "")]),
      );
    }
  } catch {
    return formError("Product specifications could not be read.");
  }
  if (current?.attributes && typeof current.attributes === "object") {
    const previous = Object.fromEntries(
      Object.entries(current.attributes)
        .filter(([key]) => !key.startsWith("_"))
        .map(([key, value]) => [key, String(value ?? "")]),
    );
    attributes = { ...previous, ...attributes };
  }

  for (const field of schemaFields) {
    if (!field.required) continue;
    if (["image", "brand", "name", "sku", "mrp", "price", "contractorDiscount", "consumerDiscount", "points", "description"].includes(field.key)) {
      continue;
    }
    if (!attributes[field.key]?.trim()) return formError(`${field.label} is required.`, field.key);
  }

  const uploadError = validateProductUploads(collectProductUploadFiles(formData));
  if (uploadError) return formError(uploadError, "images");

  const values = {
    categoryId: category.id,
    subcategoryId: subcategoryResult.subcategoryId,
    brandId: brandId || null,
    name,
    sku: sku || null,
    mrp,
    price: storedPrice,
    contractorDiscount: money(formData.get("contractorDiscount")),
    consumerDiscount: money(formData.get("consumerDiscount")),
    points,
    description: String(formData.get("description") ?? "").trim() || null,
    attributesText: attributesText || null,
    attributes,
    status: (["active", "inactive", "hidden"].includes(String(formData.get("status")))
      ? String(formData.get("status"))
      : "active") as "active" | "inactive" | "hidden",
    updatedAt: new Date(),
  };

  const publishing = values.status === "active" && (!current || !current.launchedAt);
  const productId = current?.id ?? newId();
  if (current) {
    await db.update(products).set(values).where(eq(products.id, productId));
  } else {
    await db.insert(products).values({ id: productId, ...values, launchedAt: null });
  }

  try {
    await syncImages(productId, formData, !current);
    await syncVariants(productId, formData, schemaVariantFields, {
      name,
      mrp,
      price: storedPrice,
      contractorDiscount: values.contractorDiscount ?? "",
      consumerDiscount: values.consumerDiscount ?? "",
      points: String(values.points),
      attributes,
    });
  } catch (error) {
    if (!current) await discardProduct(productId);
    return formError(error instanceof Error ? error.message : "Image upload failed.", "images");
  }

  const images = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(and(eq(productImages.productId, productId), isNull(productImages.variantId)));
  if (images.length === 0) {
    if (!current) await discardProduct(productId);
    return formError("Upload at least one product image.", "images");
  }

  if (publishing) {
    const launchedAt = new Date();
    await db.update(products).set({ launchedAt }).where(eq(products.id, productId));
    const saved = await getProduct(productId);
    if (saved) await announceProductLaunch(saved);
  }

  await db.insert(activityLogs).values({
    title: `${session.name} ${current ? "updated" : "added"} product ${name}`,
    entityType: "product",
    entityId: productId,
  });
  await markCataloguesStale([current?.categoryId, category.id]);
  refresh(productId);
  await flash("success", current ? "Product updated." : "Product added.");
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

async function syncVariants(
  productId: string,
  formData: FormData,
  fields: { key: string; label: string; type: string; required: boolean }[],
  parent: {
    name: string;
    mrp: string;
    price: string;
    contractorDiscount: string;
    consumerDiscount: string;
    points: string;
    attributes: Record<string, string>;
  },
) {
  let submitted: VariantInput[] = [];
  try {
    submitted = JSON.parse(String(formData.get("variants") ?? "[]"));
  } catch {
    throw new Error("Variants could not be read.");
  }
  if (!Array.isArray(submitted)) submitted = [];

  const current = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  const keep = new Set<string>();
  const parentValue = (key: string) => {
    if (key === "name") return parent.name;
    if (key === "mrp") return parent.mrp;
    if (key === "price") return parent.price;
    if (key === "contractorDiscount") return parent.contractorDiscount;
    if (key === "consumerDiscount") return parent.consumerDiscount;
    if (key === "points") return parent.points;
    return parent.attributes[key] ?? "";
  };

  for (const [index, variant] of submitted.entries()) {
    const copy = variant.copy ?? {};
    const raw = variant.values ?? {};
    const read = (key: string) => String(copy[key] ? parentValue(key) : raw[key] ?? "").trim();
    const file = formData.get(`variantImage_${index}`);
    const hasFile = file instanceof File && file.size > 0;
    const filled = fields.some((field) => field.type !== "image" && read(field.key)) || hasFile || variant.hasImage;
    if (!filled) continue;

    for (const field of fields) {
      if (field.type === "image") {
        if (field.required && !hasFile && !variant.hasImage) throw new Error(`${field.label} is required on each variant.`);
        continue;
      }
      if (field.required && !read(field.key)) throw new Error(`${field.label} is required on each variant.`);
    }

    const name = read("name") || [read("size"), read("finish")].filter(Boolean).join(" / ") || `Variant ${index + 1}`;
    const existing = current.find((row) => row.id === variant.id);
    const previousAttributes = existing?.attributes && typeof existing.attributes === "object" ? existing.attributes : {};
    const attributes: Record<string, unknown> = { ...previousAttributes, _copy: copy };
    for (const field of fields) {
      if (["name", "finish", "size", "price", "image"].includes(field.key)) continue;
      attributes[field.key] = read(field.key);
    }
    const values = {
      name,
      finish: read("finish") || null,
      size: read("size") || null,
      price: money(read("price")) ?? (copy.price ? parent.price : null),
      copyPriceFromParent: Boolean(copy.price),
      attributes,
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

    if (hasFile && file instanceof File) {
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
  if (!product || !["active", "hidden"].includes(status)) {
    return { error: "That product could not be updated." };
  }
  const publishing = status === "active" && !product.launchedAt;
  await db
    .update(products)
    .set({
      status: status as "active" | "hidden",
      updatedAt: new Date(),
      ...(publishing ? { launchedAt: new Date() } : {}),
    })
    .where(eq(products.id, id));
  if (publishing) {
    const saved = await getProduct(id);
    if (saved) await announceProductLaunch(saved);
  }
  await db.insert(activityLogs).values({
    title: `${session.name} set ${product.name} to ${status}`,
    entityType: "product",
    entityId: id,
  });
  await markCataloguesStale([product.categoryId]);
  refresh(id);
  return { message: status === "active" ? `${product.name} is now visible.` : `${product.name} is now hidden.` };
}

async function discardProduct(productId: string) {
  const images = await db
    .select({ url: productImages.url, objectKey: productImages.objectKey })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  await Promise.all(images.map((image) => removeStoredImage(image.url, image.objectKey)));
  await db.delete(products).where(eq(products.id, productId));
}

export async function bulkProducts(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const ids = [...new Set(formData.getAll("ids").map((value) => String(value)).filter(Boolean))];
  const action = String(formData.get("bulk") ?? "");
  if (ids.length === 0) return { error: "Select at least one product." };
  const linked = await db
    .select({
      id: products.id,
      status: products.status,
      launchedAt: products.launchedAt,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(inArray(products.id, ids));

  if (action === "delete") {
    await Promise.all(ids.map((id) => discardProduct(id)));
    await removeLaunchNotices(ids);
  } else if (action === "active" || action === "inactive" || action === "hidden") {
    const now = new Date();
    const firstLaunch = action === "active" ? linked.filter((row) => row.status !== "active" && !row.launchedAt) : [];
    await db
      .update(products)
      .set({ status: action, updatedAt: now })
      .where(inArray(products.id, ids));
    if (firstLaunch.length > 0) {
      await db
        .update(products)
        .set({ launchedAt: now })
        .where(inArray(products.id, firstLaunch.map((row) => row.id)));
      await Promise.all(
        firstLaunch.map(async (row) => {
          const saved = await getProduct(row.id);
          if (saved) await announceProductLaunch(saved);
        }),
      );
    }
  } else {
    return { error: "Choose an action for the selected products." };
  }

  await db.insert(activityLogs).values({
    title: `${session.name} ${action === "delete" ? "deleted" : `set ${action} on`} ${ids.length} products`,
    entityType: "product",
    entityId: ids[0],
  });
  await markCataloguesStale(linked.map((row) => row.categoryId));
  refresh();
  const noun = ids.length === 1 ? "product" : "products";
  if (action === "delete") return { message: `Deleted ${ids.length} ${noun}.` };
  if (action === "active") return { message: `Marked ${ids.length} ${noun} active.` };
  if (action === "hidden") return { message: `Hid ${ids.length} ${noun}.` };
  return { message: `Marked ${ids.length} ${noun} inactive.` };
}

export async function deleteProduct(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const product = await getProduct(id);
  if (!product) {
    await flash("error", "That product is no longer available.");
    redirect("/admin/products");
  }
  await discardProduct(id);
  await removeLaunchNotices([id]);
  await db.insert(activityLogs).values({
    title: `${session.name} deleted product ${product.name}`,
    entityType: "product",
    entityId: id,
  });
  await markCataloguesStale([product.categoryId]);
  refresh(id);
  const message = `${product.name} deleted.`;
  if (formData.get("stay") === "1") return { message };
  await flash("success", message);
  redirect("/admin/products");
}
