import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { catalogues } from "@/lib/db/schema";

export async function markCataloguesStale(categoryIds: Array<string | null | undefined>) {
  const ids = [...new Set(categoryIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return;
  await db
    .update(catalogues)
    .set({ status: "stale" })
    .where(and(inArray(catalogues.categoryId, ids), eq(catalogues.status, "active")));
  revalidatePath("/admin/catalogues");
  revalidatePath("/catalogues");
}
