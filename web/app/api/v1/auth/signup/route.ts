import { NextResponse } from "next/server";
import { accountFromIssuedToken, apiError, clientAddress, failureStatus, presentAccount, readPayload, tooManyAttempts } from "@/lib/api/http";
import { cleanEmail, registerCatalogueAccount } from "@/lib/auth/catalogue-account";
import { issueUserSession } from "@/lib/auth/session";
import { signInDenial } from "@/lib/auth/access";

export async function POST(request: Request) {
  if (tooManyAttempts(`signup:${clientAddress(request)}`)) {
    return apiError("Too many attempts. Wait a few minutes and try again.", 429);
  }

  const { fields, photo } = await readPayload(request);
  const result = await registerCatalogueAccount({
    name: fields.name ?? "",
    mobile: fields.mobile ?? "",
    email: cleanEmail(fields.email),
    city: fields.city ?? "",
    password: fields.password ?? "",
    confirm: fields.confirm ?? "",
    userType: fields.userType ?? "",
    photo,
  });
  if ("error" in result) return apiError(result.error, failureStatus(result.error), result.field);
  if (result.status === "pending") {
    return NextResponse.json({ data: { status: "pending", message: signInDenial("pending") } });
  }

  const issued = await issueUserSession(result.userId);
  const account = await accountFromIssuedToken(issued.token);
  if (!account) return apiError("The account could not be created.", 500);
  return NextResponse.json(
    {
      data: {
        token: issued.token,
        expiresAt: issued.expiresAt.toISOString(),
        account: presentAccount(account, request),
      },
    },
    { status: 201 },
  );
}
