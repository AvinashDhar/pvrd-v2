import { NextResponse } from "next/server";
import { absoluteUrl, publicOrigin } from "@/lib/api/http";
import { listCatalogueRows } from "@/lib/records";

export async function GET(request: Request) {
  const origin = publicOrigin(request);
  const catalogues = (await listCatalogueRows()).filter((item) => item.status === "active");
  return NextResponse.json({
    data: catalogues.map((catalogue) => ({
      id: catalogue.id,
      name: catalogue.name,
      slug: catalogue.slug,
      image: absoluteUrl(request, catalogue.image),
      products: catalogue.activeProducts,
      pdfUrl: catalogue.pdfUrl ? `${origin}/api/catalogues/${catalogue.id}/download` : null,
      viewUrl: catalogue.pdfUrl ? `${origin}/api/catalogues/${catalogue.id}/download?view=1` : null,
      generatedAt: catalogue.generatedAt,
    })),
  });
}
