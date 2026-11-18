import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export function newId() {
  return randomUUID();
}

function id() {
  return varchar("id", { length: 36 }).$defaultFn(newId).primaryKey();
}

function ref(name: string) {
  return varchar(name, { length: 36 });
}

export const userTypes = ["retailer", "contractor", "consumer"] as const;
export const accountStatuses = ["pending", "active", "inactive", "blocked"] as const;
export type UserType = (typeof userTypes)[number];
export type AccountStatus = (typeof accountStatuses)[number];
const visibilities = ["active", "inactive", "hidden"] as const;
const inquiryStatuses = ["pending", "contacted", "closed"] as const;
const loyaltyKinds = ["earn", "redeem"] as const;

function visibility(name = "status") {
  return mysqlEnum(name, [...visibilities]);
}

export const users = mysqlTable(
  "users",
  {
    id: id(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).unique(),
    mobile: varchar("mobile", { length: 32 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    userType: mysqlEnum("user_type", [...userTypes]).notNull(),
    city: varchar("city", { length: 120 }),
    photoUrl: text("photo_url"),
    photoKey: varchar("photo_key", { length: 255 }),
    status: mysqlEnum("status", [...accountStatuses]).default("active").notNull(),
    blockReason: text("block_reason"),
    lastLoginAt: datetime("last_login_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [
    index("users_type_idx").on(table.userType),
    index("users_status_idx").on(table.status),
  ],
);

export const userSessions = mysqlTable(
  "user_sessions",
  {
    id: id(),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [index("user_sessions_user_idx").on(table.userId)],
);

export const categories = mysqlTable("categories", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  imageUrl: text("image_url"),
  imageKey: varchar("image_key", { length: 255 }),
  description: text("description"),
  status: visibility().default("active").notNull(),
  fieldSchema: json("field_schema").notNull(),
  variantSchema: json("variant_schema").notNull(),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

/** Optional grouping under a category. Same content shape as categories (image + field schemas), scoped to a parent. */
export const subcategories = mysqlTable(
  "subcategories",
  {
    id: id(),
    categoryId: ref("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    imageUrl: text("image_url"),
    imageKey: varchar("image_key", { length: 255 }),
    description: text("description"),
    status: visibility().default("active").notNull(),
    fieldSchema: json("field_schema").notNull(),
    variantSchema: json("variant_schema").notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [
    index("subcategories_category_idx").on(table.categoryId),
    uniqueIndex("subcategories_category_slug_uidx").on(table.categoryId, table.slug),
  ],
);

export const brands = mysqlTable("brands", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  logoUrl: text("logo_url"),
  logoKey: varchar("logo_key", { length: 255 }),
  description: text("description"),
  status: visibility().default("active").notNull(),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

export const brandCategories = mysqlTable(
  "brand_categories",
  {
    brandId: ref("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    categoryId: ref("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.brandId, table.categoryId] })],
);

export const products = mysqlTable(
  "products",
  {
    id: id(),
    categoryId: ref("category_id")
      .notNull()
      .references(() => categories.id),
    /** Optional; null means the product sits only under its category (existing rows stay valid). */
    subcategoryId: ref("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
    brandId: ref("brand_id").references(() => brands.id),
    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 64 }),
    mrp: decimal("mrp", { precision: 12, scale: 2 }).notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    contractorDiscount: decimal("contractor_discount", { precision: 5, scale: 2 }),
    consumerDiscount: decimal("consumer_discount", { precision: 5, scale: 2 }),
    points: int("points").default(0),
    description: text("description"),
    /** Free-text search keywords for admin; not shown on storefront or mobile listings. */
    attributesText: text("attributes_text"),
    attributes: json("attributes").$type<Record<string, unknown>>().default({}),
    status: visibility().default("active").notNull(),
    launchedAt: datetime("launched_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [
    index("products_category_idx").on(table.categoryId),
    index("products_subcategory_idx").on(table.subcategoryId),
    index("products_brand_idx").on(table.brandId),
    index("products_sku_idx").on(table.sku),
    index("products_status_idx").on(table.status),
    index("products_launched_idx").on(table.launchedAt),
  ],
);

export const productVariants = mysqlTable("product_variants", {
  id: id(),
  productId: ref("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  finish: varchar("finish", { length: 120 }),
  size: varchar("size", { length: 120 }),
  price: decimal("price", { precision: 12, scale: 2 }),
  copyPriceFromParent: boolean("copy_price_from_parent").default(false),
  attributes: json("attributes").$type<Record<string, unknown>>().default({}),
  sortOrder: int("sort_order").default(0),
});

export const productImages = mysqlTable("product_images", {
  id: id(),
  productId: ref("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantId: ref("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  objectKey: varchar("object_key", { length: 255 }),
  sortOrder: int("sort_order").default(0).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

export const banners = mysqlTable("banners", {
  id: id(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  imageKey: varchar("image_key", { length: 255 }),
  type: varchar("type", { length: 40 }).notNull(),
  linkType: varchar("link_type", { length: 40 }).default("none").notNull(),
  linkId: varchar("link_id", { length: 36 }),
  redirectUrl: text("redirect_url"),
  startAt: datetime("start_at", { mode: "date" }),
  endAt: datetime("end_at", { mode: "date" }),
  status: visibility().default("active").notNull(),
  sortOrder: int("sort_order").default(0),
});

export const notifications = mysqlTable("notifications", {
  id: id(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  imageUrl: text("image_url"),
  imageKey: varchar("image_key", { length: 255 }),
  type: varchar("type", { length: 40 }).notNull(),
  audience: varchar("audience", { length: 40 }).notNull(),
  linkId: varchar("link_id", { length: 36 }),
  redirectUrl: text("redirect_url"),
  status: varchar("status", { length: 40 }).notNull(),
  scheduledAt: datetime("scheduled_at", { mode: "date" }),
  recipientCount: int("recipient_count").default(0),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
}, (table) => [index("notifications_link_idx").on(table.linkId)]);

export const notificationReads = mysqlTable(
  "notification_reads",
  {
    userId: ref("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationId: ref("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    readAt: datetime("read_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.notificationId] })],
);

export const offers = mysqlTable("offers", {
  id: id(),
  name: varchar("name", { length: 200 }).notNull(),
  scope: varchar("scope", { length: 40 }).notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  targetId: varchar("target_id", { length: 64 }),
  startAt: datetime("start_at", { mode: "date" }),
  endAt: datetime("end_at", { mode: "date" }),
  status: visibility().default("active").notNull(),
});

export const inquiries = mysqlTable("inquiries", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  productId: ref("product_id"),
  status: mysqlEnum("status", [...inquiryStatuses]).default("pending").notNull(),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

export const reviews = mysqlTable("reviews", {
  id: id(),
  consumerId: ref("consumer_id").notNull(),
  contractorId: ref("contractor_id").notNull(),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 40 }).default("pending").notNull(),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

export const catalogues = mysqlTable(
  "catalogues",
  {
    id: id(),
    categoryId: ref("category_id")
      .notNull()
      .references(() => categories.id),
    pdfUrl: text("pdf_url"),
    pdfKey: varchar("pdf_key", { length: 255 }),
    status: varchar("status", { length: 40 }).default("draft").notNull(),
    generatedAt: datetime("generated_at", { mode: "date" }),
  },
  (table) => [index("catalogues_category_idx").on(table.categoryId)],
);

export const activityLogs = mysqlTable("activity_logs", {
  id: id(),
  title: varchar("title", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 40 }),
  entityId: varchar("entity_id", { length: 64 }),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

export const settings = mysqlTable("settings", {
  id: varchar("id", { length: 32 }).primaryKey().default("company"),
  companyName: varchar("company_name", { length: 160 }).notNull(),
  tagline: varchar("tagline", { length: 200 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 40 }),
  website: varchar("website", { length: 255 }),
  address: text("address"),
  logoUrl: text("logo_url"),
  logoKey: varchar("logo_key", { length: 255 }),
  social: json("social").$type<CompanySocial>().default({}),
});

export type CompanySocial = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
};

export const admins = mysqlTable("admins", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

export const adminSessions = mysqlTable(
  "admin_sessions",
  {
    id: id(),
    adminId: ref("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [index("admin_sessions_admin_idx").on(table.adminId)],
);

export const loyaltyRules = mysqlTable("loyalty_rules", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  kind: mysqlEnum("kind", [...loyaltyKinds]).notNull(),
  scope: varchar("scope", { length: 40 }).notNull(),
  targetId: varchar("target_id", { length: 64 }),
  points: int("points"),
  minPurchase: decimal("min_purchase", { precision: 12, scale: 2 }),
  conversionRate: decimal("conversion_rate", { precision: 12, scale: 4 }),
  maxRedeemPerOrder: int("max_redeem_per_order"),
  status: visibility().default("active").notNull(),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

export const loyaltyWallets = mysqlTable("loyalty_wallets", {
  id: id(),
  userId: ref("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  available: int("available").default(0).notNull(),
  redeemed: int("redeemed").default(0).notNull(),
  expired: int("expired").default(0).notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

export const loyaltyTransactions = mysqlTable(
  "loyalty_transactions",
  {
    id: id(),
    walletId: ref("wallet_id")
      .notNull()
      .references(() => loyaltyWallets.id, { onDelete: "cascade" }),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    points: int("points").notNull(),
    note: text("note"),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [index("loyalty_tx_user_idx").on(table.userId)],
);

export const reviewReplies = mysqlTable("review_replies", {
  id: id(),
  reviewId: ref("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  contractorId: ref("contractor_id").notNull(),
  body: text("body").notNull(),
  createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
});

export const quotationStatuses = ["open", "closed"] as const;
export const quotationOutcomes = ["pending", "accepted", "declined"] as const;
export const quotationAvailabilities = ["unspecified", "available", "limited", "unavailable"] as const;
export const quotationAuthorRoles = ["user", "admin"] as const;
export const quotationMessageKinds = ["comment", "request", "accept", "decline", "close", "reopen", "availability"] as const;
export type QuotationStatus = (typeof quotationStatuses)[number];
export type QuotationOutcome = (typeof quotationOutcomes)[number];
export type QuotationAvailability = (typeof quotationAvailabilities)[number];
export type QuotationMessageKind = (typeof quotationMessageKinds)[number];

/** One working list per account. Requesting a quotation copies these lines and clears them. */
export const quotationBucketItems = mysqlTable(
  "quotation_bucket_items",
  {
    id: id(),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: ref("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: ref("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    variantKey: varchar("variant_key", { length: 36 }).notNull().default(""),
    quantity: int("quantity").notNull(),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [
    index("quotation_bucket_user_idx").on(table.userId),
    uniqueIndex("quotation_bucket_line_idx").on(table.userId, table.productId, table.variantKey),
  ],
);

export const quotations = mysqlTable(
  "quotations",
  {
    id: id(),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reference: varchar("reference", { length: 20 }).notNull().unique(),
    status: mysqlEnum("status", [...quotationStatuses]).default("open").notNull(),
    outcome: mysqlEnum("outcome", [...quotationOutcomes]).default("pending").notNull(),
    note: text("note"),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
    closedAt: datetime("closed_at", { mode: "date" }),
  },
  (table) => [
    index("quotations_user_idx").on(table.userId),
    index("quotations_status_idx").on(table.status),
    index("quotations_created_idx").on(table.createdAt),
  ],
);

export const quotationItems = mysqlTable(
  "quotation_items",
  {
    id: id(),
    quotationId: ref("quotation_id")
      .notNull()
      .references(() => quotations.id, { onDelete: "cascade" }),
    productId: ref("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: ref("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: varchar("product_name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 64 }),
    finish: varchar("finish", { length: 120 }),
    size: varchar("size", { length: 120 }),
    unit: varchar("unit", { length: 40 }),
    packing: varchar("packing", { length: 80 }),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    priceLabel: varchar("price_label", { length: 16 }).notNull(),
    availability: mysqlEnum("availability", [...quotationAvailabilities]).default("unspecified").notNull(),
    leadTime: varchar("lead_time", { length: 120 }),
    itemNote: text("item_note"),
    sortOrder: int("sort_order").default(0).notNull(),
  },
  (table) => [index("quotation_items_quotation_idx").on(table.quotationId)],
);

export const quotationMessages = mysqlTable(
  "quotation_messages",
  {
    id: id(),
    quotationId: ref("quotation_id")
      .notNull()
      .references(() => quotations.id, { onDelete: "cascade" }),
    authorRole: mysqlEnum("author_role", [...quotationAuthorRoles]).notNull(),
    authorId: varchar("author_id", { length: 36 }).notNull(),
    authorName: varchar("author_name", { length: 160 }).notNull(),
    kind: mysqlEnum("kind", [...quotationMessageKinds]).notNull(),
    body: text("body").notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).default(sql`(utc_timestamp(3))`).notNull(),
  },
  (table) => [index("quotation_messages_quotation_idx").on(table.quotationId, table.createdAt)],
);

export const analyticsEvents = mysqlTable(
  "analytics_events",
  {
    id: id(),
    type: varchar("type", { length: 40 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }).notNull(),
    userId: ref("user_id"),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(utc_timestamp())`).notNull(),
  },
  (table) => [
    index("analytics_events_entity_idx").on(table.entityType, table.entityId),
    index("analytics_events_type_idx").on(table.type),
  ],
);
