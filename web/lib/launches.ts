import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, notifications, users } from "@/lib/db/schema";
import { fallbackImage } from "@/lib/media";

type LaunchProduct = {
  id: string;
  name: string;
  status: string;
  categoryId: string;
  categoryName?: string | null;
  image?: string | null;
};

export async function announceProductLaunch(product: LaunchProduct) {
  if (product.status !== "active") return;
  const [category] = await db
    .select({ status: categories.status, name: categories.name })
    .from(categories)
    .where(eq(categories.id, product.categoryId))
    .limit(1);
  if (!category || category.status !== "active") return;

  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.type, "product_launch"), eq(notifications.linkId, product.id)))
    .limit(1);
  if (existing) return;

  const [totals] = await db.select({ total: count() }).from(users).where(eq(users.status, "active"));
  const categoryName = product.categoryName || category.name;
  const image = product.image && product.image !== fallbackImage ? product.image : null;
  await db.insert(notifications).values({
    title: launchTitle(product.name),
    message: `${product.name} is now in the catalogue${categoryName ? `, under ${categoryName}` : ""}.`,
    imageUrl: image,
    type: "product_launch",
    audience: "all",
    linkId: product.id,
    redirectUrl: `/products/${product.id}`,
    status: "sent",
    scheduledAt: new Date(),
    recipientCount: Number(totals?.total ?? 0),
  });
}

export async function removeLaunchNotices(productIds: string[]) {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return;
  await db
    .delete(notifications)
    .where(and(eq(notifications.type, "product_launch"), inArray(notifications.linkId, ids)));
}

function launchTitle(name: string) {
  const suffix = " is now available";
  const room = 200 - suffix.length;
  const trimmed = name.length > room ? `${name.slice(0, Math.max(room - 1, 1)).trimEnd()}…` : name;
  return `${trimmed}${suffix}`;
}
