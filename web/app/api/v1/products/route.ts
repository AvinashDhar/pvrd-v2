import { NextResponse } from "next/server";
import { catalogueViewer, presentCard } from "@/lib/api/present";
import { filterCatalogue, publicProducts } from "@/lib/catalogue";

export async function GET(request: Request) {
  const viewer = await catalogueViewer(request);
  if (viewer.response) return viewer.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || undefined;
  const category = url.searchParams.get("category")?.trim() || undefined;
  const products = q || category ? await filterCatalogue({ q, category }) : await publicProducts();

  return NextResponse.json({
    data: products.map((product) => presentCard(product, viewer.trade, request)),
    trade: viewer.trade,
    nextCursor: null,
  });
}
