import { NextResponse } from "next/server";
import { apiError, requestAccount } from "@/lib/api/http";
import { QuotationError, closeQuotation, commentOnQuotation, getUserQuotation } from "@/lib/quotations/service";

async function owner(request: Request) {
  const access = await requestAccount(request);
  if (access.response) return { account: null, response: access.response };
  if (!access.account) return { account: null, response: apiError("Sign in to see this quotation.", 401) };
  return { account: access.account, response: null };
}

function iso(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function present(quotation: Awaited<ReturnType<typeof getUserQuotation>>) {
  return {
    ...quotation,
    createdAt: iso(quotation.createdAt),
    updatedAt: iso(quotation.updatedAt),
    closedAt: iso(quotation.closedAt),
    messages: quotation.messages.map((message) => ({ ...message, createdAt: iso(message.createdAt) })),
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await owner(request);
  if (access.response) return access.response;
  const { id } = await context.params;
  try {
    return NextResponse.json({ data: present(await getUserQuotation(access.account.id, id)) });
  } catch (error) {
    if (error instanceof QuotationError) return apiError(error.message, error.status);
    throw error;
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await owner(request);
  if (access.response) return access.response;
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { action?: unknown; body?: unknown } | null;
  const action = body?.action === "close" ? "close" : "comment";
  const author = { id: access.account.id, name: access.account.name, role: "user" as const };
  try {
    if (action === "close") await closeQuotation(id, author);
    else await commentOnQuotation(id, author, typeof body?.body === "string" ? body.body : "");
    return NextResponse.json({ data: present(await getUserQuotation(access.account.id, id)) });
  } catch (error) {
    if (error instanceof QuotationError) return apiError(error.message, error.status);
    throw error;
  }
}
