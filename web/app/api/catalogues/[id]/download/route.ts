import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { recordProductEvent } from "@/lib/analytics";
import { db } from "@/lib/db";
import { catalogues, categories, products } from "@/lib/db/schema";
import { readStoredPdf } from "@/lib/storage/objects";

const categoryIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const back = NextResponse.redirect(new URL("/catalogues", request.url));
  if (!categoryIdPattern.test(id)) return back;

  const [catalogue] = await db
    .select({
      pdfUrl: catalogues.pdfUrl,
      pdfKey: catalogues.pdfKey,
      name: categories.name,
    })
    .from(catalogues)
    .innerJoin(categories, eq(catalogues.categoryId, categories.id))
    .where(eq(catalogues.categoryId, id))
    .limit(1);
  if (!catalogue?.pdfUrl) return back;

  const view = new URL(request.url).searchParams.get("view") === "1";
  if (!view) {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.categoryId, id), eq(products.status, "active")));
    await recordProductEvent("download", rows.map((row) => row.id));
  }

  const bytes = await readStoredPdf(catalogue.pdfKey);
  if (!bytes) {
    if (catalogue.pdfUrl.startsWith("http")) return NextResponse.redirect(catalogue.pdfUrl);
    return back;
  }

  const filename = pdfName(catalogue.name);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${view ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}

function pdfName(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "catalogue";
  return `${slug}-catalogue.pdf`;
}
