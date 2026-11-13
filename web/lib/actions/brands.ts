"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, brandCategories, brands, newId } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { getBrand } from "@/lib/catalogue/queries";
import { removeStoredImage, storeImage } from "@/lib/storage/images";

function refresh() {
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function saveBrand(_previous: { error: string } | null, formData: FormData) {
  const session = await getAdminSession();
  if (!session) return { error: "Sign in again." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const categoryIds = formData.getAll("categoryIds").map(String);
  if (!name) return { error: "Brand name is required." };
  if (!["active", "inactive"].includes(status)) return { error: "Choose a valid status." };

  const current = id ? await getBrand(id) : null;
  if (id && !current) return { error: "Brand was not found." };

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
      return { error: error instanceof Error ? error.message : "Logo upload failed." };
    }
  }
  if (!logoUrl) return { error: "A JPG, PNG, or WEBP logo is required." };

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
  redirect(`/admin/brands/${brandId}`);
}

export async function deleteBrand(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const brand = await getBrand(id);
  if (!brand) redirect("/admin/brands");
  if (brand.productCount > 0) {
    redirect(`/admin/brands/${id}?error=${encodeURIComponent("This brand still has products, so it cannot be deleted.")}`);
  }
  await removeStoredImage(brand.logoUrl, brand.logoKey);
  await db.delete(brands).where(eq(brands.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} deleted brand ${brand.name}`,
    entityType: "brand",
    entityId: id,
  });
  refresh();
  redirect("/admin/brands");
}
