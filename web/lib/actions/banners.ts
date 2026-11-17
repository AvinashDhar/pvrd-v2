"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, banners, newId, notifications } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { bannerLinkTypes, bannerTypes, getBanner, type BannerLinkType, type BannerType } from "@/lib/banners/queries";
import { removeStoredImage, storeImage } from "@/lib/storage/images";
import { flash } from "@/lib/flash";
import { formError } from "@/lib/forms";

async function removeBannerImage(url: string | null, key: string) {
  const shared = await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.imageKey, key)).limit(1);
  if (shared.length === 0) await removeStoredImage(url, key);
}

function refresh() {
  revalidatePath("/admin/banners");
  revalidatePath("/admin/notifications");
  revalidatePath("/");
}

function readDate(value: FormDataEntryValue | null, end = false) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(`${text}T${end ? "23:59:59.000Z" : "00:00:00.000Z"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveBanner(_previous: { error: string; field?: string } | null, formData: FormData) {
  const session = await getAdminSession();
  if (!session) return formError("Sign in again.");

  const id = String(formData.get("id") ?? "");
  const current = id ? await getBanner(id) : null;
  if (id && !current) return formError("Banner was not found.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const status = String(formData.get("status") ?? "active");
  const redirectUrl = String(formData.get("redirectUrl") ?? "").trim();
  const linkType = String(formData.get("linkType") ?? "none");
  const linkId = String(formData.get("linkId") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const startAt = readDate(formData.get("startAt"));
  const endAt = readDate(formData.get("endAt"), true);

  if (!title) return formError("Banner title is required.", "title");
  if (title.length > 200) return formError("Title must be 200 characters or fewer.", "title");
  if (!description) return formError("Banner description is required.", "description");
  if (description.length > 2000) return formError("Description must be 2000 characters or fewer.", "description");
  if (!bannerTypes.includes(type as BannerType)) return formError("Choose a banner type.", "type");
  if (!["active", "inactive"].includes(status)) return formError("Choose a valid status.", "status");
  if (!bannerLinkTypes.includes(linkType as BannerLinkType)) return formError("Choose a valid link.", "linkType");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return formError("Display order must be a whole number from 0 to 9999.", "sortOrder");
  }
  if (type === "category" && (linkType !== "category" || !linkId)) {
    return formError("Choose the category this banner belongs to.", "linkId");
  }
  if (linkType !== "none" && !linkId) return formError("Choose the item this banner links to.", "linkId");
  if ((type === "homepage" || type === "promotional") && !startAt) {
    return formError("Start date is required for this banner.", "startAt");
  }
  if ((type === "homepage" || type === "promotional") && !endAt) {
    return formError("End date is required for this banner.", "endAt");
  }
  if (startAt && endAt && endAt < startAt) return formError("End date must be on or after the start date.", "endAt");
  if (type === "promotional" && !redirectUrl && linkType === "none") {
    return formError("Add a redirect link or choose a product, category, brand, or offer.", "redirectUrl");
  }
  if (redirectUrl.length > 500) return formError("Redirect link must be 500 characters or fewer.", "redirectUrl");

  const bannerId = current?.id ?? newId();
  let imageUrl = current?.imageUrl ?? null;
  let imageKey = current?.imageKey ?? null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      const stored = await storeImage(image, { folder: "banners", id: bannerId });
      imageUrl = stored.url;
      imageKey = stored.key;
    } catch (error) {
      return formError(error instanceof Error ? error.message : "Image upload failed.", "image");
    }
  }
  if (!imageUrl) return formError("A banner image is required.", "image");

  const values = {
    title,
    description,
    imageUrl,
    imageKey,
    type,
    linkType,
    linkId: linkType === "none" ? null : linkId,
    redirectUrl: redirectUrl || null,
    startAt,
    endAt,
    status: status as "active" | "inactive",
    sortOrder,
  };

  if (current) {
    await db.update(banners).set(values).where(eq(banners.id, bannerId));
    if (current.imageKey && current.imageKey !== imageKey) await removeBannerImage(current.imageUrl, current.imageKey);
  } else {
    await db.insert(banners).values({ id: bannerId, ...values });
  }

  if (formData.get("notify") === "on") {
    await db.insert(notifications).values({
      title,
      message: description,
      imageUrl,
      imageKey,
      type: "banner",
      audience: "all",
      redirectUrl: redirectUrl || null,
      status: "draft",
      recipientCount: 0,
    });
  }

  await db.insert(activityLogs).values({
    title: `${session.name} ${current ? "updated" : "added"} banner ${title}`,
    entityType: "banner",
    entityId: bannerId,
  });
  refresh();
  await flash("success", current ? "Banner updated." : "Banner added.");
  redirect(`/admin/banners/${bannerId}`);
}

export async function setBannerStatus(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const banner = await getBanner(id);
  if (!banner || !["active", "inactive"].includes(status)) {
    return { error: "That banner could not be updated." };
  }
  await db.update(banners).set({ status: status as "active" | "inactive" }).where(eq(banners.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} set banner ${banner.title} to ${status}`,
    entityType: "banner",
    entityId: id,
  });
  refresh();
  revalidatePath(`/admin/banners/${id}`);
  return { message: status === "active" ? `${banner.title} is enabled.` : `${banner.title} is disabled.` };
}

export async function deleteBanner(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const id = String(formData.get("id") ?? "");
  const banner = await getBanner(id);
  if (!banner) {
    await flash("error", "That banner is no longer available.");
    redirect("/admin/banners");
  }

  if (banner.imageKey) await removeBannerImage(banner.imageUrl, banner.imageKey);

  await db.delete(banners).where(eq(banners.id, id));
  await db.insert(activityLogs).values({
    title: `${session.name} deleted banner ${banner.title}`,
    entityType: "banner",
    entityId: id,
  });
  refresh();
  await flash("success", `${banner.title} deleted.`);
  redirect("/admin/banners");
}
