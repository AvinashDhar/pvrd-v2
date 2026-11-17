"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, brandCategories, brands, newId } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { getBrand } from "@/lib/catalogue/queries";
import { removeStoredImage, storeImage } from "@/lib/storage/images";
import { flash } from "@/lib/flash";
import { formError } from "@/lib/forms";

function refresh() {
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function saveBrand(_previous: { error: string; field?: string } | null, formData: FormData) {
  const session = await getAdminSession();
  if (!session) return formError("Sign in again.");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const categoryIds = formData.getAll("categoryIds").map(String);
  if (!name) return formError("Brand name is required.", "name");
  if (name.length > 160) return formError("Name must be 160 characters or fewer.", "name");
  if (description.length > 2000) return formError("Description must be 2000 characters or fewer.", "description");
  if (!["active", "inactive"].includes(status)) return formError("Choose a valid status.", "status");

  const current = id ? await getBrand(id) : null;
  if (id && !current) return formError("Brand was not found.");

  const brandId = current?.id ?? newId();
  let logoUrl = current?.logoUrl ?? null;
  let logoKey = current?.logoKey ?? null;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      const stored = await storeImage(logo, { folder: "brands", id: brandId });
      logoUrl = stored.url;
      logoKey = stored.key;
    } catch (error) {
      return formError(error instanceof Error ? error.message : "Logo upload failed.", "logo");
    }
  }
  if (!logoUrl) return formError("A JPG, PNG, or WEBP logo is required.", "logo");

  const values = {
    name,
    description: description || null,
    status: status as "active" | "inactive",
    logoUrl,
    logoKey,
  };

  const previousLogo = current?.logoUrl ?? null;
  if (current) {
    await db.update(brands).set(values).where(eq(brands.id, brandId));
  } else {
    await db.insert(brands).values({ id: brandId, ...values });
  }
  if (previousLogo && previousLogo !== logoUrl) await removeStoredImage(previousLogo, current?.logoKey);

  await db.delete(brandCategories).where(eq(brandCategories.brandId, brandId));
  if (categoryIds.length > 0) {
    await db.insert(brandCategories).values(categoryIds.map((categoryId) => ({ brandId, categoryId })));
  }

  await db.insert(activityLogs).values({
    title: `${session.name} ${current ? "updated" : "added"} brand ${name}`,
    entityType: "brand",
    entityId: brandId,
  });
  refresh();
  await flash("success", current ? "Brand updated." : "Brand added.");
  redirect(`/admin/brands/${brandId}`);
}

export async function deleteBrand(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const brand = await getBrand(id);
  if (!brand) {
    await flash("error", "That brand is no longer available.");
    redirect("/admin/brands");
  }
  if (brand.productCount > 0) {
    return { error: "This brand still has products, so it cannot be deleted." };
  }
  await removeStoredImage(brand.logoUrl, brand.logoKey);
  await db.delete(brands).where(eq(brands.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} deleted brand ${brand.name}`,
    entityType: "brand",
    entityId: id,
  });
  refresh();
  await flash("success", `${brand.name} deleted.`);
  redirect("/admin/brands");
}
