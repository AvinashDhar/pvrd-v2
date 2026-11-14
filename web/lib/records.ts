import { count, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/lib/db";
import {
  activityLogs,
  brands,
  catalogues,
  categories,
  inquiries,
  loyaltyWallets,
  notifications,
  offers,
  products,
  reviewReplies,
  reviews,
  users,
} from "@/lib/db/schema";
import { fallbackImage } from "@/lib/media";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function adminSearchIndex() {
  const [productRows, categoryRows, brandRows, userRows] = await Promise.all([
    db.select({ id: products.id, name: products.name }).from(products).orderBy(products.name).limit(500),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name),
    db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(brands.name),
    db.select({ id: users.id, name: users.name }).from(users).orderBy(users.name).limit(200),
  ]);
  return {
    products: productRows,
    categories: categoryRows,
    brands: brandRows,
    users: userRows,
  };
}

export type AdminSearchIndex = Awaited<ReturnType<typeof adminSearchIndex>>;

export async function dashboardData() {
  const [productTotals] = await db
    .select({
      total: count(),
      hidden: sql<number>`sum(case when ${products.status} = 'hidden' then 1 else 0 end)`,
    })
    .from(products);
  const [categoryTotal] = await db.select({ total: count() }).from(categories);
  const [brandTotal] = await db.select({ total: count() }).from(brands);
  const [userTotals] = await db
    .select({
      total: count(),
      retailers: sql<number>`sum(case when ${users.userType} = 'retailer' then 1 else 0 end)`,
      contractors: sql<number>`sum(case when ${users.userType} = 'contractor' then 1 else 0 end)`,
      pending: sql<number>`sum(case when ${users.status} = 'pending' then 1 else 0 end)`,
      pendingRetailers: sql<number>`sum(case when ${users.status} = 'pending' and ${users.userType} = 'retailer' then 1 else 0 end)`,
      pendingContractors: sql<number>`sum(case when ${users.status} = 'pending' and ${users.userType} = 'contractor' then 1 else 0 end)`,
    })
    .from(users);
  const [inquiryTotals] = await db
    .select({
      pending: sql<number>`sum(case when ${inquiries.status} = 'pending' then 1 else 0 end)`,
    })
    .from(inquiries);
  const activity = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8);
  const topCategories = await db
    .select({ label: categories.name, value: count(products.id) })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id, categories.name)
    .orderBy(sql`count(${products.id}) desc`)
    .limit(6);
  const topBrands = await db
    .select({ label: brands.name, value: count(products.id) })
    .from(brands)
    .leftJoin(products, eq(products.brandId, brands.id))
    .groupBy(brands.id, brands.name)
    .orderBy(sql`count(${products.id}) desc`)
    .limit(5);

  return {
    products: asNumber(productTotals?.total),
    hiddenProducts: asNumber(productTotals?.hidden),
    categories: asNumber(categoryTotal?.total),
    brands: asNumber(brandTotal?.total),
    users: asNumber(userTotals?.total),
    retailers: asNumber(userTotals?.retailers),
    contractors: asNumber(userTotals?.contractors),
    pendingUsers: asNumber(userTotals?.pending),
    pendingRetailers: asNumber(userTotals?.pendingRetailers),
    pendingContractors: asNumber(userTotals?.pendingContractors),
    pendingInquiries: asNumber(inquiryTotals?.pending),
    activity,
    topCategories: topCategories.map((row) => ({ label: row.label, value: asNumber(row.value) })),
    topBrands: topBrands.map((row) => ({ label: row.label, value: asNumber(row.value) })),
  };
}

export async function listReviewRows() {
  const consumer = alias(users, "review_consumer");
  const contractor = alias(users, "review_contractor");
  const rows = await db
    .select({
      id: reviews.id,
      title: reviews.title,
      rating: reviews.rating,
      status: reviews.status,
      createdAt: reviews.createdAt,
      consumer: consumer.name,
      contractor: contractor.name,
    })
    .from(reviews)
    .innerJoin(consumer, eq(reviews.consumerId, consumer.id))
    .innerJoin(contractor, eq(reviews.contractorId, contractor.id))
    .orderBy(desc(reviews.createdAt));
  const replies = await db.select({ reviewId: reviewReplies.reviewId }).from(reviewReplies);
  const replied = new Set(replies.map((reply) => reply.reviewId));
  return rows.map((row) => ({ ...row, replied: replied.has(row.id) }));
}

export async function listInquiryRows() {
  return db
    .select({
      id: inquiries.id,
      name: inquiries.name,
      type: inquiries.type,
      subject: inquiries.subject,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      product: products.name,
    })
    .from(inquiries)
    .leftJoin(products, eq(inquiries.productId, products.id))
    .orderBy(desc(inquiries.createdAt));
}

export async function listNotificationRows() {
  return db.select().from(notifications).orderBy(desc(notifications.createdAt));
}

export async function listOfferRows() {
  return db.select().from(offers).orderBy(desc(offers.startAt));
}

export function offerIsCurrent(offer: { status: string; startAt: Date | string | null; endAt: Date | string | null }) {
  if (offer.status !== "active") return false;
  const now = Date.now();
  if (offer.startAt && new Date(offer.startAt).getTime() > now) return false;
  if (offer.endAt && new Date(offer.endAt).getTime() < now) return false;
  return true;
}

export async function listLoyaltyRows() {
  return db
    .select({
      id: loyaltyWallets.id,
      name: users.name,
      type: users.userType,
      available: loyaltyWallets.available,
      redeemed: loyaltyWallets.redeemed,
      expired: loyaltyWallets.expired,
    })
    .from(loyaltyWallets)
    .innerJoin(users, eq(loyaltyWallets.userId, users.id))
    .orderBy(users.name);
}

export async function listCatalogueRows() {
  const [categoryRows, files, totals] = await Promise.all([
    db.select().from(categories).orderBy(categories.name),
    db.select().from(catalogues).orderBy(catalogues.generatedAt),
    db
      .select({
        categoryId: products.categoryId,
        total: count(),
        active: sql<number>`coalesce(sum(case when ${products.status} = 'active' then 1 else 0 end), 0)`,
      })
      .from(products)
      .groupBy(products.categoryId),
  ]);
  const counts = new Map(totals.map((row) => [row.categoryId, { total: asNumber(row.total), active: asNumber(row.active) }]));
  const filesByCategory = new Map(files.map((file) => [file.categoryId, file]));
  return categoryRows.map((category) => {
    const file = filesByCategory.get(category.id);
    const countForCategory = counts.get(category.id);
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      status: category.status,
      image: category.imageUrl || fallbackImage,
      products: countForCategory?.total ?? 0,
      activeProducts: countForCategory?.active ?? 0,
      pdfUrl: file?.pdfUrl ?? null,
      pdfStatus: file?.status ?? "draft",
      generatedAt: file?.generatedAt ?? null,
    };
  });
}
