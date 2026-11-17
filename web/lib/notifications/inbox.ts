import { and, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationReads, notifications } from "@/lib/db/schema";
import type { CatalogueAccount } from "@/lib/auth/session";

const audiencesFor = (userType: CatalogueAccount["userType"]) => {
  const values = ["all", userType];
  if (userType === "contractor") values.push("carpenter");
  return values;
};

function visibleTo(account: CatalogueAccount) {
  return and(
    eq(notifications.status, "sent"),
    inArray(notifications.audience, audiencesFor(account.userType)),
    or(isNull(notifications.scheduledAt), lte(notifications.scheduledAt, new Date())),
  );
}

export async function listInbox(account: CatalogueAccount) {
  const rows = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      message: notifications.message,
      imageUrl: notifications.imageUrl,
      type: notifications.type,
      audience: notifications.audience,
      linkId: notifications.linkId,
      redirectUrl: notifications.redirectUrl,
      createdAt: notifications.createdAt,
      readAt: notificationReads.readAt,
    })
    .from(notifications)
    .leftJoin(
      notificationReads,
      and(eq(notificationReads.notificationId, notifications.id), eq(notificationReads.userId, account.id)),
    )
    .where(visibleTo(account))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return rows.map((row) => ({ ...row, read: Boolean(row.readAt) }));
}

export async function unreadCount(account: CatalogueAccount) {
  const rows = await listInbox(account);
  return rows.filter((row) => !row.read).length;
}

export async function markNotificationsRead(account: CatalogueAccount, ids: string[]) {
  const allowed = new Set((await listInbox(account)).map((row) => row.id));
  const targets = [...new Set(ids.filter((id) => allowed.has(id)))];
  if (targets.length === 0) return;
  const readAt = new Date();
  await db
    .insert(notificationReads)
    .values(targets.map((notificationId) => ({ userId: account.id, notificationId, readAt })))
    .onDuplicateKeyUpdate({ set: { readAt } });
}
