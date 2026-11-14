import { NextResponse } from "next/server";
import { apiError, failureStatus, presentAccount, readPayload, requestAccount } from "@/lib/api/http";
import { cleanEmail, updateCatalogueProfile } from "@/lib/auth/catalogue-account";
import { accountFromToken, getUserSession, readBearerToken } from "@/lib/auth/session";

export async function GET(request: Request) {
  const access = await requestAccount(request);
  if (access.response) return access.response;
  if (!access.account) return apiError("Sign in to view this account.", 401);
  return NextResponse.json({ data: presentAccount(access.account, request) });
}

export async function PATCH(request: Request) {
  const access = await requestAccount(request);
  if (access.response) return access.response;
  if (!access.account) return apiError("Sign in to view this account.", 401);

  const { fields, photo } = await readPayload(request);
  const result = await updateCatalogueProfile(access.account, {
    name: fields.name ?? access.account.name,
    email: fields.email === undefined ? access.account.email : cleanEmail(fields.email),
    city: fields.city ?? access.account.city ?? "",
    password: fields.password ?? "",
    confirm: fields.confirm ?? "",
    photo,
  });
  if ("error" in result) return apiError(result.error, failureStatus(result.error), result.field);

  const bearer = readBearerToken(request);
  const refreshed = bearer.kind === "token" ? await accountFromToken(bearer.token) : await getUserSession();
  if (!refreshed) return apiError("Sign in again.", 401);
  return NextResponse.json({ data: presentAccount(refreshed, request) });
}
