import { NextResponse } from "next/server";
import { accountFromToken, getRequestAccount, type CatalogueAccount } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/access";

const attempts = new Map<string, number[]>();

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function tooManyAttempts(key: string, limit = 10, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return true;
  }
  recent.push(now);
  attempts.set(key, recent);
  return false;
}

export function apiError(error: string, status: number, field?: string) {
  return NextResponse.json(field ? { error, field } : { error }, { status });
}

export function publicOrigin(request: Request) {
  const configured = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export function absoluteUrl(request: Request, value: string | null | undefined) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${publicOrigin(request)}${value}`;
  return value;
}

export async function requestAccount(request: Request) {
  const result = await getRequestAccount(request);
  if (result.invalidToken) return { account: null as CatalogueAccount | null, response: apiError("Sign in again.", 401) };
  return { account: result.account, response: null };
}

export function presentAccount(account: CatalogueAccount, request: Request) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    mobile: account.mobile,
    userType: account.userType,
    role: roleLabel(account.userType),
    city: account.city,
    status: account.status,
    photoUrl: absoluteUrl(request, account.photoUrl),
    lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
  };
}

export async function accountFromIssuedToken(token: string) {
  return accountFromToken(token);
}

export async function readPayload(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await request.json().catch(() => null);
    const fields: Record<string, string> = {};
    if (body && typeof body === "object") {
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === "string" || typeof value === "number") fields[key] = String(value);
      }
    }
    return { fields, photo: null as File | null };
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { fields: {}, photo: null };
  }
  const fields: Record<string, string> = {};
  let photo: File | null = null;
  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      if (key === "photo" && value.size > 0) photo = value;
      continue;
    }
    fields[key] = value;
  }
  return { fields, photo };
}

export function failureStatus(error: string) {
  if (/already uses/i.test(error)) return 409;
  if (/incorrect/i.test(error)) return 401;
  if (/waiting|deactivated|blocked|cannot sign in/i.test(error)) return 403;
  return 400;
}
