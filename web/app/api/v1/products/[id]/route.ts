import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { catalogueViewer, presentCard, presentProduct } from "@/lib/api/present";
import { recordProductEvent } from "@/lib/analytics";
import { getPublicProduct, publicProducts } from "@/lib/catalogue";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await catalogueViewer(request);
  if (viewer.response) return viewer.response;

  const { id } = await context.params;
  const product = await getPublicProduct(id);
  if (!product) return apiError("Product not found.", 404);

  await recordProductEvent("view", [id]);
  const catalogue = await publicProducts();
  const related = catalogue.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
  const more = related.length ? related : catalogue.filter((item) => item.id !== product.id).slice(0, 3);

  return NextResponse.json({
    data: {
      ...presentProduct(product, viewer.trade, request),
      related: more.map((item) => presentCard(item, viewer.trade, request)),
    },
    trade: viewer.trade,
  });
}
