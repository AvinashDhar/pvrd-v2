import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { catalogueViewer, presentCard, presentProduct } from "@/lib/api/present";
import { recordProductEvent } from "@/lib/analytics";
import { getPublicProduct, relatedPublicProducts } from "@/lib/catalogue";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await catalogueViewer(request);
  if (viewer.response) return viewer.response;

  const { id } = await context.params;
  const product = await getPublicProduct(id);
  if (!product) return apiError("Product not found.", 404);

  await recordProductEvent("view", [id]);
  const more = await relatedPublicProducts(product.categoryId, product.id);

  return NextResponse.json({
    data: {
      ...presentProduct(product, viewer.trade, request),
      related: more.map((item) => presentCard(item, viewer.trade, request)),
    },
    trade: viewer.trade,
  });
}
