import { NextResponse } from "next/server";
import { apiError, requestAccount } from "@/lib/api/http";
import { QuotationError, listUserQuotations, requestQuotation } from "@/lib/quotations/service";

async function owner(request: Request) {
  const access = await requestAccount(request);
  if (access.response) return { account: null, response: access.response };
  if (!access.account) return { account: null, response: apiError("Sign in to see your quotations.", 401) };
  return { account: access.account, response: null };
}

function iso(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(request: Request) {
  const access = await owner(request);
  if (access.response) return access.response;
  const rows = await listUserQuotations(access.account.id);
  return NextResponse.json({
    data: rows.map((row) => ({
      ...row,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    })),
  });
}

export async function POST(request: Request) {
  const access = await owner(request);
  if (access.response) return access.response;
  const body = (await request.json().catch(() => null)) as { note?: unknown } | null;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";
  try {
    const id = await requestQuotation(access.account, note);
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    if (error instanceof QuotationError) return apiError(error.message, error.status);
    throw error;
  }
}
