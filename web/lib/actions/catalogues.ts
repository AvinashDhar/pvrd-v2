"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { buildCataloguePdf } from "@/lib/catalogues/content";
import { renderCataloguePdf } from "@/lib/catalogues/render";
import { getAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { activityLogs, catalogues } from "@/lib/db/schema";
import { removeStoredPdf, storePdf } from "@/lib/storage/objects";

export type CatalogueActionState = { error: string } | { ok: true } | null;

export async function generateCatalogue(
  _previous: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Sign in again." };

  const categoryId = String(formData.get("categoryId") ?? "");
  try {
    const built = await buildCataloguePdf(categoryId);
    if ("error" in built) return { error: built.error };

    const pdf = await renderCataloguePdf(built.model);
    const stored = await storePdf(categoryId, Buffer.from(pdf));
    const existing = await db.select().from(catalogues).where(eq(catalogues.categoryId, categoryId));
    const [current, ...extra] = existing;

    if (current) {
      await db
        .update(catalogues)
        .set({
          pdfUrl: stored.url,
          pdfKey: stored.key,
          status: "active",
          generatedAt: built.model.generatedAt,
        })
        .where(eq(catalogues.id, current.id));
      if (extra.length > 0) {
        await db.delete(catalogues).where(inArray(catalogues.id, extra.map((row) => row.id)));
        for (const row of extra) {
          if (row.pdfKey && row.pdfKey !== stored.key) await removeStoredPdf(row.pdfKey);
        }
      }
    } else {
      await db.insert(catalogues).values({
        categoryId,
        pdfUrl: stored.url,
        pdfKey: stored.key,
        status: "active",
        generatedAt: built.model.generatedAt,
      });
    }

    await db.insert(activityLogs).values({
      title: `${session.name} generated the ${built.model.categoryName} catalogue`,
      entityType: "catalogue",
      entityId: categoryId,
    });
    revalidatePath("/admin/catalogues");
    revalidatePath("/catalogues");
    revalidatePath("/");
    revalidatePath("/admin/reports");
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The catalogue could not be generated." };
  }
}
