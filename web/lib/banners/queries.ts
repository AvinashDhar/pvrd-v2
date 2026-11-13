import { and, count, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsEvents, banners, brands, categories, offers, products } from "@/lib/db/schema";

export const bannerTypes = ["homepage", "category", "promotional"] as const;
export const bannerLinkTypes = ["none", "category", "product", "brand", "offer"] as const;

export type BannerType = (typeof bannerTypes)[number];
export type BannerLinkType = (typeof bannerLinkTypes)[number];

export type BannerFilters = {
  q?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
};

function dayStart(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayEnd(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function bannerTiming(banner: { status: string; startAt: Date | null; endAt: Date | null }, now = new Date()) {
  if (banner.status !== "active") return banner.status;
  if (banner.startAt && banner.startAt > now) return "scheduled";
  if (banner.endAt && banner.endAt < now) return "ended";
  return "active";
}

export async function listBanners(filters: BannerFilters = {}) {
  const conditions = [];
  const q = filters.q?.trim();
  if (q) {
    const term = `%${q.replace(/[%_]/g, "").toLowerCase()}%`;
    conditions.push(sql`lower(${banners.title}) like ${term}`);
  }
  if (filters.type && filters.type !== "all") conditions.push(eq(banners.type, filters.type));
  if (filters.status === "inactive") conditions.push(eq(banners.status, "inactive"));
  if (filters.status === "active") conditions.push(eq(banners.status, "active"));
  const from = dayStart(filters.from);
  const to = dayEnd(filters.to);
  if (from) conditions.push(or(isNull(banners.endAt), gte(banners.endAt, from)));
  if (to) conditions.push(or(isNull(banners.startAt), lte(banners.startAt, to)));

  const rows = await db
    .select()
    .from(banners)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(banners.sortOrder, banners.title);

  return attachBannerMeta(rows);
}

export async function getBanner(id: string) {
  const [row] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!row) return null;
  const [enriched] = await attachBannerMeta([row]);
  return enriched;
}

export async function bannerStats() {
  const rows = await db.select().from(banners);
  const now = new Date();
  const events = await db
    .select({ type: analyticsEvents.type, total: count() })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.entityType, "banner"))
    .groupBy(analyticsEvents.type);
  const counts = new Map(events.map((event) => [event.type, Number(event.total)]));
  return {
    total: rows.length,
    active: rows.filter((row) => bannerTiming(row, now) === "active").length,
    homepage: rows.filter((row) => row.type === "homepage").length,
    category: rows.filter((row) => row.type === "category").length,
    promotional: rows.filter((row) => row.type === "promotional").length,
    views: counts.get("view") ?? 0,
    clicks: counts.get("click") ?? 0,
  };
}

export async function bannerLinkOptions() {
  const [categoryRows, productRows, brandRows, offerRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name),
    db.select({ id: products.id, name: products.name, sku: products.sku }).from(products).orderBy(products.name),
    db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(brands.name),
    db.select({ id: offers.id, name: offers.name }).from(offers).orderBy(offers.name),
  ]);
  return {
    categories: categoryRows.map((row) => ({ id: row.id, label: row.name })),
    products: productRows.map((row) => ({ id: row.id, label: row.sku ? `${row.name} (${row.sku})` : row.name })),
    brands: brandRows.map((row) => ({ id: row.id, label: row.name })),
    offers: offerRows.map((row) => ({ id: row.id, label: row.name })),
  };
}

export async function listPublicBanners(type: BannerType, linkId?: string) {
  const now = new Date();
  const conditions = [
    eq(banners.type, type),
    eq(banners.status, "active"),
    or(isNull(banners.startAt), lte(banners.startAt, now)),
    or(isNull(banners.endAt), gte(banners.endAt, now)),
  ];
  if (linkId) conditions.push(eq(banners.linkId, linkId));
  return db.select().from(banners).where(and(...conditions)).orderBy(banners.sortOrder, banners.title);
}

async function attachBannerMeta<T extends { id: string; linkType: string; linkId: string | null }>(rows: T[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const events = await db
    .select({
      entityId: analyticsEvents.entityId,
      type: analyticsEvents.type,
      total: count(),
    })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.entityType, "banner"), inArray(analyticsEvents.entityId, ids)))
    .groupBy(analyticsEvents.entityId, analyticsEvents.type);

  const views = new Map<string, number>();
  const clicks = new Map<string, number>();
  for (const event of events) {
    const bucket = event.type === "click" ? clicks : event.type === "view" ? views : null;
    if (bucket) bucket.set(event.entityId, Number(event.total));
  }

  const labels = await linkLabelMap(rows);
  return rows.map((row) => ({
    ...row,
    linkLabel: row.linkId ? labels.get(`${row.linkType}:${row.linkId}`) ?? "Missing link" : null,
    views: views.get(row.id) ?? 0,
    clicks: clicks.get(row.id) ?? 0,
  }));
}

async function linkLabelMap(rows: { linkType: string; linkId: string | null }[]) {
  const labels = new Map<string, string>();
  const idsFor = (type: string) => rows.filter((row) => row.linkType === type && row.linkId).map((row) => row.linkId as string);
  const categoryIds = [...new Set(idsFor("category"))];
  const productIds = [...new Set(idsFor("product"))];
  const brandIds = [...new Set(idsFor("brand"))];
  const offerIds = [...new Set(idsFor("offer"))];

  if (categoryIds.length > 0) {
    const found = await db.select({ id: categories.id, name: categories.name }).from(categories).where(inArray(categories.id, categoryIds));
    for (const row of found) labels.set(`category:${row.id}`, row.name);
  }
  if (productIds.length > 0) {
    const found = await db.select({ id: products.id, name: products.name, sku: products.sku }).from(products).where(inArray(products.id, productIds));
    for (const row of found) labels.set(`product:${row.id}`, row.sku ? `${row.name} (${row.sku})` : row.name);
  }
  if (brandIds.length > 0) {
    const found = await db.select({ id: brands.id, name: brands.name }).from(brands).where(inArray(brands.id, brandIds));
    for (const row of found) labels.set(`brand:${row.id}`, row.name);
  }
  if (offerIds.length > 0) {
    const found = await db.select({ id: offers.id, name: offers.name }).from(offers).where(inArray(offers.id, offerIds));
    for (const row of found) labels.set(`offer:${row.id}`, row.name);
  }
  return labels;
}
