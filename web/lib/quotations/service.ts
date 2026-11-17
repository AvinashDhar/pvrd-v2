import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLogs,
  categories,
  newId,
  productImages,
  productVariants,
  products,
  quotationBucketItems,
  quotationItems,
  quotationMessages,
  quotations,
  users,
  type QuotationAvailability,
  type QuotationOutcome,
  type QuotationStatus,
} from "@/lib/db/schema";
import { isTradeAccount } from "@/lib/pricing";

const MAX_QUANTITY = 999;
const availabilityLabels: Record<QuotationAvailability, string> = {
  unspecified: "Not set",
  available: "Available",
  limited: "Limited stock",
  unavailable: "Not available",
};

export class QuotationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function parseQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
  return quantity;
}

function cleanText(value: unknown, max: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.slice(0, max);
}

function money(value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function attributeText(attributes: unknown, key: string) {
  if (!attributes || typeof attributes !== "object") return null;
  const value = (attributes as Record<string, unknown>)[key];
  if (value == null || value === "") return null;
  return String(value);
}

function linePrice(product: { mrp: string; price: string }, variant: { price: string | null; attributes: unknown } | null, trade: boolean) {
  if (trade) {
    const amount = money(variant?.price) ?? money(product.price) ?? 0;
    return { unitPrice: amount.toFixed(2), priceLabel: "trade" as const };
  }
  const variantMrp = money(attributeText(variant?.attributes, "mrp"));
  const amount = variantMrp ?? money(product.mrp) ?? 0;
  return { unitPrice: amount.toFixed(2), priceLabel: "mrp" as const };
}

function referenceCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return `Q-${code}`;
}

async function catalogueProduct(productId: string, variantId: string | null) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      mrp: products.mrp,
      price: products.price,
      status: products.status,
      categoryStatus: categories.status,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, productId))
    .limit(1);
  if (!product || product.status !== "active" || product.categoryStatus !== "active") {
    throw new QuotationError("This product is not in the catalogue.", 404);
  }

  const variantRows = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  if (!variantId) {
    if (variantRows.length > 0) throw new QuotationError("Choose a finish and size.", 400);
    return { product, variant: null };
  }
  const variant = variantRows.find((item) => item.id === variantId);
  if (!variant) throw new QuotationError("Choose a listed finish and size.", 400);
  return { product, variant };
}

export async function listBucket(userId: string, trade: boolean) {
  const rows = await db
    .select({
      id: quotationBucketItems.id,
      productId: quotationBucketItems.productId,
      variantId: quotationBucketItems.variantId,
      quantity: quotationBucketItems.quantity,
      name: products.name,
      sku: products.sku,
      mrp: products.mrp,
      price: products.price,
      status: products.status,
      finish: productVariants.finish,
      size: productVariants.size,
      variantPrice: productVariants.price,
      attributes: productVariants.attributes,
    })
    .from(quotationBucketItems)
    .innerJoin(products, eq(quotationBucketItems.productId, products.id))
    .leftJoin(productVariants, eq(quotationBucketItems.variantId, productVariants.id))
    .where(eq(quotationBucketItems.userId, userId))
    .orderBy(quotationBucketItems.createdAt);

  const productIds = [...new Set(rows.map((row) => row.productId))];
  const images = productIds.length
    ? await db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(productImages.sortOrder)
    : [];

  const items = rows.map((row) => {
    const variant = row.variantId ? { price: row.variantPrice, attributes: row.attributes } : null;
    const priced = linePrice(row, variant, trade);
    const mrp = linePrice(row, variant, false).unitPrice;
    const tradePrice = linePrice(row, variant, true).unitPrice;
    const image = images.find((item) => item.productId === row.productId && item.isPrimary && !item.variantId)
      ?? images.find((item) => item.productId === row.productId && !item.variantId)
      ?? null;
    return {
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      name: row.name,
      sku: row.sku,
      finish: row.finish,
      size: row.size,
      quantity: row.quantity,
      unitPrice: priced.unitPrice,
      priceLabel: priced.priceLabel,
      mrp,
      tradePrice,
      image: image?.url ?? null,
      available: row.status === "active",
    };
  });
  return {
    items,
    count: items.length,
    pieces: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export async function addToBucket(userId: string, input: { productId: string; variantId: string | null; quantity: number }) {
  const { productId, variantId, quantity } = input;
  await catalogueProduct(productId, variantId);
  const variantKey = variantId ?? "";
  const [existing] = await db
    .select()
    .from(quotationBucketItems)
    .where(and(eq(quotationBucketItems.userId, userId), eq(quotationBucketItems.productId, productId), eq(quotationBucketItems.variantKey, variantKey)))
    .limit(1);

  if (existing) {
    await db
      .update(quotationBucketItems)
      .set({ quantity: Math.min(MAX_QUANTITY, existing.quantity + quantity), updatedAt: new Date() })
      .where(eq(quotationBucketItems.id, existing.id));
    return existing.id;
  }

  const id = newId();
  await db.insert(quotationBucketItems).values({
    id,
    userId,
    productId,
    variantId,
    variantKey,
    quantity,
  });
  return id;
}

export async function setBucketQuantity(userId: string, itemId: string, quantity: number) {
  const [item] = await db
    .select({ id: quotationBucketItems.id })
    .from(quotationBucketItems)
    .where(and(eq(quotationBucketItems.id, itemId), eq(quotationBucketItems.userId, userId)))
    .limit(1);
  if (!item) throw new QuotationError("That line is no longer in your bucket.", 404);
  await db.update(quotationBucketItems).set({ quantity, updatedAt: new Date() }).where(eq(quotationBucketItems.id, itemId));
}

export async function removeBucketItem(userId: string, itemId: string) {
  const [item] = await db
    .select({ id: quotationBucketItems.id })
    .from(quotationBucketItems)
    .where(and(eq(quotationBucketItems.id, itemId), eq(quotationBucketItems.userId, userId)))
    .limit(1);
  if (!item) throw new QuotationError("That line is no longer in your bucket.", 404);
  await db.delete(quotationBucketItems).where(eq(quotationBucketItems.id, itemId));
}

export async function requestQuotation(account: { id: string; name: string; userType: string }, note: string) {
  const trade = isTradeAccount(account.userType);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.transaction(async (tx) => {
        const rows = await tx
          .select({
            id: quotationBucketItems.id,
            productId: quotationBucketItems.productId,
            variantId: quotationBucketItems.variantId,
            quantity: quotationBucketItems.quantity,
            name: products.name,
            sku: products.sku,
            mrp: products.mrp,
            price: products.price,
            status: products.status,
            categoryStatus: categories.status,
            finish: productVariants.finish,
            size: productVariants.size,
            variantPrice: productVariants.price,
            attributes: productVariants.attributes,
          })
          .from(quotationBucketItems)
          .innerJoin(products, eq(quotationBucketItems.productId, products.id))
          .innerJoin(categories, eq(products.categoryId, categories.id))
          .leftJoin(productVariants, eq(quotationBucketItems.variantId, productVariants.id))
          .where(eq(quotationBucketItems.userId, account.id))
          .orderBy(quotationBucketItems.createdAt);
        if (rows.length === 0) throw new QuotationError("Your quotation bucket is empty.", 400);
        const blocked = rows.find((row) => row.status !== "active" || row.categoryStatus !== "active");
        if (blocked) throw new QuotationError(`${blocked.name} is no longer in the catalogue. Remove it before requesting.`, 400);

        const quotationId = newId();
        const reference = referenceCode();
        const now = new Date();
        await tx.insert(quotations).values({
          id: quotationId,
          userId: account.id,
          reference,
          note: note || null,
          createdAt: now,
          updatedAt: now,
        });
        await tx.insert(quotationItems).values(
          rows.map((row, index) => {
            const priced = linePrice(row, row.variantId ? { price: row.variantPrice, attributes: row.attributes } : null, trade);
            return {
              quotationId,
              productId: row.productId,
              variantId: row.variantId,
              productName: row.name,
              sku: row.sku,
              finish: row.finish,
              size: row.size,
              unit: attributeText(row.attributes, "Unit") ?? attributeText(row.attributes, "unit"),
              packing: attributeText(row.attributes, "Packing") ?? attributeText(row.attributes, "packing"),
              quantity: row.quantity,
              unitPrice: priced.unitPrice,
              priceLabel: priced.priceLabel,
              sortOrder: index,
            };
          }),
        );
        await tx.insert(quotationMessages).values({
          quotationId,
          authorRole: "user",
          authorId: account.id,
          authorName: account.name,
          kind: "request",
          body: note || "Requested a quotation.",
          createdAt: now,
        });
        await tx.insert(activityLogs).values({
          title: `${account.name} requested quotation ${reference}`,
          entityType: "quotation",
          entityId: quotationId,
        });
        await tx.delete(quotationBucketItems).where(eq(quotationBucketItems.userId, account.id));
        return quotationId;
      });
    } catch (error) {
      if (error instanceof QuotationError) throw error;
      const duplicate = error instanceof Error && /duplicate|quotation_reference/i.test(error.message);
      if (!duplicate || attempt === 2) throw error;
    }
  }
  throw new QuotationError("The quotation could not be opened. Try again.", 500);
}

function presentItem(item: typeof quotationItems.$inferSelect) {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    name: item.productName,
    sku: item.sku,
    finish: item.finish,
    size: item.size,
    unit: item.unit,
    packing: item.packing,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    priceLabel: item.priceLabel,
    availability: item.availability,
    leadTime: item.leadTime,
    itemNote: item.itemNote,
  };
}

function presentMessage(message: typeof quotationMessages.$inferSelect) {
  return {
    id: message.id,
    role: message.authorRole,
    author: message.authorName,
    kind: message.kind,
    body: message.body,
    createdAt: message.createdAt,
  };
}

async function loadQuotation(id: string) {
  const [quotation] = await db
    .select({
      id: quotations.id,
      reference: quotations.reference,
      status: quotations.status,
      outcome: quotations.outcome,
      note: quotations.note,
      createdAt: quotations.createdAt,
      updatedAt: quotations.updatedAt,
      closedAt: quotations.closedAt,
      userId: users.id,
      userName: users.name,
      mobile: users.mobile,
      userType: users.userType,
      city: users.city,
    })
    .from(quotations)
    .innerJoin(users, eq(quotations.userId, users.id))
    .where(eq(quotations.id, id))
    .limit(1);
  if (!quotation) return null;
  const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)).orderBy(quotationItems.sortOrder);
  const messages = await db.select().from(quotationMessages).where(eq(quotationMessages.quotationId, id)).orderBy(quotationMessages.createdAt);
  return {
    id: quotation.id,
    reference: quotation.reference,
    status: quotation.status,
    outcome: quotation.outcome,
    note: quotation.note,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
    closedAt: quotation.closedAt,
    user: {
      id: quotation.userId,
      name: quotation.userName,
      mobile: quotation.mobile,
      userType: quotation.userType,
      city: quotation.city,
    },
    items: items.map(presentItem),
    messages: messages.map(presentMessage),
  };
}

export type QuotationAttention = "new" | "reply";

const userWaitKinds = new Set(["request", "comment"]);
const adminAckKinds = new Set(["comment", "accept", "decline", "availability"]);

/** Open quotations that still need an admin reply. A later admin comment, decision, or availability update clears this. */
export function quotationAttention(
  status: string,
  lastUserAt: Date | string | null | undefined,
  lastAdminAt: Date | string | null | undefined,
): QuotationAttention | null {
  if (status !== "open") return null;
  const userAt = lastUserAt ? new Date(lastUserAt).getTime() : 0;
  const adminAt = lastAdminAt ? new Date(lastAdminAt).getTime() : 0;
  if (!Number.isFinite(adminAt) || adminAt <= 0) return "new";
  if (Number.isFinite(userAt) && userAt > adminAt) return "reply";
  return null;
}

export function attentionForMessages(
  status: string,
  messages: { role: string; kind: string; createdAt: Date | string | null }[],
) {
  let lastUser: Date | null = null;
  let lastAdmin: Date | null = null;
  for (const message of messages) {
    if (!message.createdAt) continue;
    const at = new Date(message.createdAt);
    if (Number.isNaN(at.getTime())) continue;
    if (message.role === "user" && userWaitKinds.has(message.kind) && (!lastUser || at > lastUser)) lastUser = at;
    if (message.role === "admin" && adminAckKinds.has(message.kind) && (!lastAdmin || at > lastAdmin)) lastAdmin = at;
  }
  return quotationAttention(status, lastUser, lastAdmin);
}

function attentionRank(attention: QuotationAttention | null) {
  if (attention === "new") return 0;
  if (attention === "reply") return 1;
  return 2;
}

async function attentionMarks(ids: string[]) {
  const marks = new Map<string, { lastUserAt: Date | null; lastAdminAt: Date | null }>();
  if (ids.length === 0) return marks;
  const rows = await db
    .select({
      quotationId: quotationMessages.quotationId,
      lastUserAt: sql<string | null>`max(case when ${quotationMessages.authorRole} = 'user' and ${quotationMessages.kind} in ('request', 'comment') then ${quotationMessages.createdAt} end)`,
      lastAdminAt: sql<string | null>`max(case when ${quotationMessages.authorRole} = 'admin' and ${quotationMessages.kind} in ('comment', 'accept', 'decline', 'availability') then ${quotationMessages.createdAt} end)`,
    })
    .from(quotationMessages)
    .where(inArray(quotationMessages.quotationId, ids))
    .groupBy(quotationMessages.quotationId);
  for (const row of rows) {
    marks.set(row.quotationId, {
      lastUserAt: row.lastUserAt ? new Date(row.lastUserAt) : null,
      lastAdminAt: row.lastAdminAt ? new Date(row.lastAdminAt) : null,
    });
  }
  return marks;
}

function productLabel(item: {
  productName: string;
  finish: string | null;
  size: string | null;
  quantity: number;
  unit: string | null;
}) {
  const option = [item.size, item.finish].map((part) => part?.trim()).filter(Boolean).join(", ");
  const name = option ? `${item.productName} (${option})` : item.productName;
  const unit = item.unit?.trim();
  const pieces = !unit || /^(pc|pcs|piece|pieces|nos?\.?|no\.?)$/i.test(unit);
  return pieces ? `${name} × ${item.quantity}` : `${name} × ${item.quantity} ${unit}`;
}

function productPreview(labels: string[]) {
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 3).join(", ")} + ${labels.length - 3} more`;
}

const PREVIEW_LIMIT = 4;

async function quotationPreviews(ids: string[]) {
  const previews = new Map<string, { name: string; image: string | null }[]>();
  if (ids.length === 0) return previews;
  const lines = await db
    .select({
      quotationId: quotationItems.quotationId,
      productId: quotationItems.productId,
      variantId: quotationItems.variantId,
      productName: quotationItems.productName,
    })
    .from(quotationItems)
    .where(inArray(quotationItems.quotationId, ids))
    .orderBy(quotationItems.quotationId, quotationItems.sortOrder);

  const productIds = [...new Set(lines.map((line) => line.productId).filter((id): id is string => Boolean(id)))];
  const images = productIds.length
    ? await db
        .select({
          productId: productImages.productId,
          variantId: productImages.variantId,
          url: productImages.url,
        })
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(desc(productImages.isPrimary), productImages.sortOrder)
    : [];

  const byVariant = new Map<string, string>();
  const byProduct = new Map<string, string>();
  for (const image of images) {
    if (image.variantId && !byVariant.has(image.variantId)) byVariant.set(image.variantId, image.url);
    if (!image.variantId && !byProduct.has(image.productId)) byProduct.set(image.productId, image.url);
  }

  for (const line of lines) {
    const list = previews.get(line.quotationId) ?? [];
    if (list.length >= PREVIEW_LIMIT) continue;
    const image =
      (line.variantId ? byVariant.get(line.variantId) : undefined) ??
      (line.productId ? byProduct.get(line.productId) : undefined) ??
      null;
    list.push({ name: line.productName, image });
    previews.set(line.quotationId, list);
  }
  return previews;
}

async function productSummaries(ids: string[]) {
  const summaries = new Map<string, string>();
  if (ids.length === 0) return summaries;
  const lines = await db
    .select({
      quotationId: quotationItems.quotationId,
      productName: quotationItems.productName,
      finish: quotationItems.finish,
      size: quotationItems.size,
      quantity: quotationItems.quantity,
      unit: quotationItems.unit,
    })
    .from(quotationItems)
    .where(inArray(quotationItems.quotationId, ids))
    .orderBy(quotationItems.quotationId, quotationItems.sortOrder);
  const grouped = new Map<string, string[]>();
  for (const line of lines) {
    const labels = grouped.get(line.quotationId) ?? [];
    labels.push(productLabel(line));
    grouped.set(line.quotationId, labels);
  }
  for (const id of ids) summaries.set(id, productPreview(grouped.get(id) ?? []));
  return summaries;
}

export async function listUserQuotations(userId: string) {
  const rows = await db
    .select({
      id: quotations.id,
      reference: quotations.reference,
      status: quotations.status,
      outcome: quotations.outcome,
      createdAt: quotations.createdAt,
      updatedAt: quotations.updatedAt,
      items: sql<number>`count(${quotationItems.id})`,
      pieces: sql<number>`coalesce(sum(${quotationItems.quantity}), 0)`,
    })
    .from(quotations)
    .leftJoin(quotationItems, eq(quotationItems.quotationId, quotations.id))
    .where(eq(quotations.userId, userId))
    .groupBy(quotations.id)
    .orderBy(desc(quotations.updatedAt));
  const ids = rows.map((row) => row.id);
  const [summaries, previews] = await Promise.all([productSummaries(ids), quotationPreviews(ids)]);
  return rows.map((row) => ({
    ...row,
    items: Number(row.items),
    pieces: Number(row.pieces),
    summary: summaries.get(row.id) ?? "",
    previews: previews.get(row.id) ?? [],
  }));
}

export async function getUserQuotation(userId: string, id: string) {
  const quotation = await loadQuotation(id);
  if (!quotation || quotation.user.id !== userId) throw new QuotationError("Quotation not found.", 404);
  return quotation;
}

async function requireOpen(id: string, userId?: string) {
  const quotation = userId ? await getUserQuotation(userId, id) : await loadQuotation(id);
  if (!quotation) throw new QuotationError("Quotation not found.", 404);
  if (quotation.status !== "open") throw new QuotationError("This quotation is closed.", 409);
  return quotation;
}

export async function commentOnQuotation(
  quotationId: string,
  author: { id: string; name: string; role: "user" | "admin" },
  body: string,
) {
  const text = cleanText(body, 2000);
  if (text.length < 1) throw new QuotationError("Write a comment.", 400);
  if (author.role === "user") await requireOpen(quotationId, author.id);
  else await requireOpen(quotationId);
  await db.insert(quotationMessages).values({
    quotationId,
    authorRole: author.role,
    authorId: author.id,
    authorName: author.name,
    kind: "comment",
    body: text,
    createdAt: new Date(),
  });
  await db.update(quotations).set({ updatedAt: new Date() }).where(eq(quotations.id, quotationId));
}

export async function closeQuotation(quotationId: string, author: { id: string; name: string; role: "user" | "admin" }) {
  if (author.role === "user") await requireOpen(quotationId, author.id);
  else await requireOpen(quotationId);
  const now = new Date();
  await db.update(quotations).set({ status: "closed", closedAt: now, updatedAt: now }).where(eq(quotations.id, quotationId));
  await db.insert(quotationMessages).values({
    quotationId,
    authorRole: author.role,
    authorId: author.id,
    authorName: author.name,
    kind: "close",
    body: "Closed this quotation.",
    createdAt: now,
  });
}

export async function listAdminQuotations(filters: { status?: QuotationStatus; outcome?: QuotationOutcome; q?: string }) {
  const where: SQL[] = [];
  if (filters.status) where.push(eq(quotations.status, filters.status));
  if (filters.outcome) where.push(eq(quotations.outcome, filters.outcome));
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_]/g, "")}%`;
    where.push(or(like(users.name, term), like(users.mobile, term), like(quotations.reference, term))!);
  }
  const rows = await db
    .select({
      id: quotations.id,
      reference: quotations.reference,
      status: quotations.status,
      outcome: quotations.outcome,
      createdAt: quotations.createdAt,
      updatedAt: quotations.updatedAt,
      userId: users.id,
      userName: users.name,
      mobile: users.mobile,
      userType: users.userType,
      items: sql<number>`count(${quotationItems.id})`,
      pieces: sql<number>`coalesce(sum(${quotationItems.quantity}), 0)`,
    })
    .from(quotations)
    .innerJoin(users, eq(quotations.userId, users.id))
    .leftJoin(quotationItems, eq(quotationItems.quotationId, quotations.id))
    .where(where.length ? and(...where) : undefined)
    .groupBy(quotations.id, users.id)
    .orderBy(desc(quotations.updatedAt));
  const ids = rows.map((row) => row.id);
  const [summaries, marks] = await Promise.all([productSummaries(ids), attentionMarks(ids)]);
  return rows
    .map((row) => {
      const mark = marks.get(row.id);
      return {
        ...row,
        items: Number(row.items),
        pieces: Number(row.pieces),
        summary: summaries.get(row.id) ?? "",
        attention: quotationAttention(row.status, mark?.lastUserAt, mark?.lastAdminAt),
      };
    })
    .sort((a, b) => {
      const rank = attentionRank(a.attention) - attentionRank(b.attention);
      if (rank !== 0) return rank;
      return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
    });
}

export async function countQuotationsAwaitingAdmin() {
  const rows = await db
    .select({ id: quotations.id, status: quotations.status })
    .from(quotations)
    .where(eq(quotations.status, "open"));
  const marks = await attentionMarks(rows.map((row) => row.id));
  return rows.filter((row) => quotationAttention(row.status, marks.get(row.id)?.lastUserAt, marks.get(row.id)?.lastAdminAt)).length;
}

export async function getAdminQuotation(id: string) {
  const quotation = await loadQuotation(id);
  if (!quotation) throw new QuotationError("Quotation not found.", 404);
  return quotation;
}

export async function decideQuotation(
  quotationId: string,
  admin: { id: string; name: string },
  outcome: Exclude<QuotationOutcome, "pending">,
  comment: string,
) {
  const quotation = await requireOpen(quotationId);
  if (quotation.outcome !== "pending") throw new QuotationError("This quotation already has a decision.", 409);
  const text = cleanText(comment, 2000);
  if (text.length < 3) throw new QuotationError(outcome === "accepted" ? "Accept with a short comment." : "Decline with a short comment.", 400);
  const now = new Date();
  await db.update(quotations).set({ outcome, updatedAt: now }).where(eq(quotations.id, quotationId));
  await db.insert(quotationMessages).values({
    quotationId,
    authorRole: "admin",
    authorId: admin.id,
    authorName: admin.name,
    kind: outcome === "accepted" ? "accept" : "decline",
    body: text,
    createdAt: now,
  });
}

export async function reopenQuotation(quotationId: string, admin: { id: string; name: string }) {
  const quotation = await loadQuotation(quotationId);
  if (!quotation) throw new QuotationError("Quotation not found.", 404);
  if (quotation.status !== "closed") throw new QuotationError("This quotation is already open.", 409);
  const now = new Date();
  await db.update(quotations).set({ status: "open", closedAt: null, updatedAt: now }).where(eq(quotations.id, quotationId));
  await db.insert(quotationMessages).values({
    quotationId,
    authorRole: "admin",
    authorId: admin.id,
    authorName: admin.name,
    kind: "reopen",
    body: "Reopened this quotation.",
    createdAt: now,
  });
}

export async function updateQuotationItems(
  quotationId: string,
  admin: { id: string; name: string },
  updates: { id: string; availability: QuotationAvailability; leadTime: string; itemNote: string }[],
) {
  await requireOpen(quotationId);
  const current = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  const byId = new Map(current.map((item) => [item.id, item]));
  const changes: string[] = [];
  for (const update of updates) {
    const item = byId.get(update.id);
    if (!item) continue;
    const leadTime = cleanText(update.leadTime, 120) || null;
    const itemNote = cleanText(update.itemNote, 500) || null;
    const same = item.availability === update.availability && (item.leadTime ?? null) === leadTime && (item.itemNote ?? null) === itemNote;
    if (same) continue;
    await db
      .update(quotationItems)
      .set({ availability: update.availability, leadTime, itemNote })
      .where(eq(quotationItems.id, item.id));
    const label = [item.size, item.finish].filter(Boolean).join(" ") || item.productName;
    const timing = leadTime ? `, ${leadTime}` : "";
    const note = itemNote ? ` — ${itemNote}` : "";
    changes.push(`${item.productName}${label === item.productName ? "" : ` (${label})`}: ${availabilityLabels[update.availability]}${timing}${note}`);
  }
  if (changes.length === 0) return;
  await db.insert(quotationMessages).values({
    quotationId,
    authorRole: "admin",
    authorId: admin.id,
    authorName: admin.name,
    kind: "availability",
    body: `Availability update:\n${changes.join("\n")}`,
    createdAt: new Date(),
  });
  await db.update(quotations).set({ updatedAt: new Date() }).where(eq(quotations.id, quotationId));
}
