import { NextResponse } from "next/server";
import { absoluteUrl, apiError, requestAccount } from "@/lib/api/http";
import { isTradeAccount } from "@/lib/pricing";
import { QuotationError, addToBucket, listBucket, parseQuantity, removeBucketItem, setBucketQuantity } from "@/lib/quotations/service";

async function owner(request: Request) {
  const access = await requestAccount(request);
  if (access.response) return { account: null, response: access.response };
  if (!access.account) return { account: null, response: apiError("Sign in to use your quotation bucket.", 401) };
  return { account: access.account, response: null };
}

function failure(error: unknown) {
  if (error instanceof QuotationError) return apiError(error.message, error.status);
  throw error;
}

export async function GET(request: Request) {
  const access = await owner(request);
  if (access.response) return access.response;
  const bucket = await listBucket(access.account.id, isTradeAccount(access.account.userType));
  return NextResponse.json({
    data: {
      ...bucket,
      items: bucket.items.map((item) => ({ ...item, image: absoluteUrl(request, item.image) })),
    },
  });
}

export async function POST(request: Request) {
  const access = await owner(request);
  if (access.response) return access.response;
  const body = (await request.json().catch(() => null)) as { productId?: unknown; variantId?: unknown; quantity?: unknown } | null;
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const variantId = typeof body?.variantId === "string" && body.variantId ? body.variantId : null;
  const quantity = parseQuantity(body?.quantity ?? 1);
  if (!productId) return apiError("Choose a product.", 400);
  if (!quantity) return apiError("Enter a quantity from 1 to 999.", 400);
  try {
    await addToBucket(access.account.id, { productId, variantId, quantity });
  } catch (error) {
    return failure(error);
  }
  const bucket = await listBucket(access.account.id, isTradeAccount(access.account.userType));
  return NextResponse.json({
    data: { ...bucket, items: bucket.items.map((item) => ({ ...item, image: absoluteUrl(request, item.image) })) },
  });
}

export async function PATCH(request: Request) {
  const access = await owner(request);
  if (access.response) return access.response;
  const body = (await request.json().catch(() => null)) as { itemId?: unknown; quantity?: unknown } | null;
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  const quantity = parseQuantity(body?.quantity);
  if (!itemId || !quantity) return apiError("Enter a quantity from 1 to 999.", 400);
  try {
    await setBucketQuantity(access.account.id, itemId, quantity);
  } catch (error) {
    return failure(error);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const access = await owner(request);
  if (access.response) return access.response;
  const itemId = new URL(request.url).searchParams.get("itemId") ?? "";
  if (!itemId) return apiError("Choose a line to remove.", 400);
  try {
    await removeBucketItem(access.account.id, itemId);
  } catch (error) {
    return failure(error);
  }
  return NextResponse.json({ ok: true });
}
