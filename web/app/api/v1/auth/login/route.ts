import { NextResponse } from "next/server";
import { accountFromIssuedToken, apiError, clientAddress, failureStatus, presentAccount, readPayload, tooManyAttempts } from "@/lib/api/http";
import { authenticateCatalogueAccount } from "@/lib/auth/catalogue-account";
import { issueUserSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (tooManyAttempts(`login:${clientAddress(request)}`)) {
    return apiError("Too many attempts. Wait a few minutes and try again.", 429);
  }

  const payload = await readPayload(request);
  if (payload.error) return apiError(payload.error, failureStatus(payload.error), payload.field);
  const { fields } = payload;
  const result = await authenticateCatalogueAccount(fields.identifier ?? "", fields.password ?? "");
  if ("error" in result) return apiError(result.error, failureStatus(result.error), result.field);

  const issued = await issueUserSession(result.userId);
  const account = await accountFromIssuedToken(issued.token);
  if (!account) return apiError("This account cannot sign in.", 403);
  return NextResponse.json({
    data: {
      token: issued.token,
      expiresAt: issued.expiresAt.toISOString(),
      account: presentAccount(account, request),
    },
  });
}
