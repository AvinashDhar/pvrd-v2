import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/schema";

export async function recordProductEvent(type: "view" | "download", productIds: string[]) {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return;
  await db.insert(analyticsEvents).values(
    ids.map((entityId) => ({
      type,
      entityType: "product",
      entityId,
    })),
  );
}
