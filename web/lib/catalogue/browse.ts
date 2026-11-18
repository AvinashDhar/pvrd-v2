"use server";

import { getUserSession } from "@/lib/auth/session";
import { catalogueBatchSize, pageCatalogue } from "@/lib/catalogue";
import { isTradeAccount } from "@/lib/pricing";

export async function loadCatalogueBatch(input: {
  q?: string;
  category?: string;
  subcategory?: string;
  sort: "relevance" | "name" | "price-asc" | "price-desc";
  offset: number;
}) {
  const account = await getUserSession();
  return pageCatalogue({
    q: input.q,
    category: input.category,
    subcategory: input.subcategory,
    sort: input.sort,
    trade: isTradeAccount(account?.userType),
    limit: catalogueBatchSize,
    offset: Math.max(0, input.offset),
  });
}
