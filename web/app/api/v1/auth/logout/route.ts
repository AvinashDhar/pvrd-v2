import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { destroyRequestSession, readBearerToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (readBearerToken(request).kind === "invalid") return apiError("Sign in again.", 401);
  await destroyRequestSession(request);
  return NextResponse.json({ data: { ok: true } });
}
