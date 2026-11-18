import { NextResponse } from "next/server";
import { catalogueViewer, presentCard } from "@/lib/api/present";
import { cataloguePageSize, pageCatalogue } from "@/lib/catalogue";

export async function GET(request: Request) {
  const viewer = await catalogueViewer(request);
  if (viewer.response) return viewer.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || undefined;
  const category = url.searchParams.get("category")?.trim() || undefined;
  const subcategory = url.searchParams.get("subcategory")?.trim() || undefined;
  const sortParam = url.searchParams.get("sort");
  const sort = sortParam === "price-asc" || sortParam === "price-desc" || sortParam === "name" ? sortParam : "relevance";
  const requested = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), 50) : cataloguePageSize;
  const offset = readCursor(url.searchParams.get("cursor"));
  const page = await pageCatalogue({ q, category, subcategory, sort, trade: viewer.trade, limit, offset });
  const nextOffset = offset + page.items.length;

  return NextResponse.json({
    data: page.items.map((product) => presentCard(product, viewer.trade, request)),
    trade: viewer.trade,
    total: page.total,
    nextCursor: nextOffset < page.total ? writeCursor(nextOffset) : null,
  });
}

function readCursor(value: string | null) {
  if (!value) return 0;
  const offset = Number(Buffer.from(value, "base64url").toString("utf8"));
  return Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
}

function writeCursor(offset: number) {
  return Buffer.from(String(offset)).toString("base64url");
}
