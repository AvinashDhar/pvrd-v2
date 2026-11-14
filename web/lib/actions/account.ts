"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { newId, userTypes, users } from "@/lib/db/schema";
import { normalizeMobile, signInDenial } from "@/lib/auth/access";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createUserSession, destroyUserSession, getUserSession } from "@/lib/auth/session";
import { removeStoredImage, storeImage } from "@/lib/storage/images";
import { formError } from "@/lib/forms";
import { catalogueReturnPath } from "@/lib/pricing";

function cleanEmail(value: FormDataEntryValue | null) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return email;
}

export async function signup(_previous: { error: string; field?: string } | null, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const mobile = normalizeMobile(String(formData.get("mobile") ?? ""));
  const email = cleanEmail(formData.get("email"));
  const city = String(formData.get("city") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const userType = String(formData.get("userType") ?? "");

  if (name.length < 2) return formError("Enter your full name.", "name");
  if (name.length > 160) return formError("Name must be 160 characters or fewer.", "name");
  if (!mobile) return formError("Enter a valid 10-digit mobile number.", "mobile");
  if (email === undefined) return formError("Enter a valid email, or leave it blank.", "email");
  if (email && email.length > 255) return formError("Email must be 255 characters or fewer.", "email");
  if (city.length < 2) return formError("Enter your city.", "city");
  if (city.length > 120) return formError("City must be 120 characters or fewer.", "city");
  if (password.length < 8 || password.length > 128) return formError("Use a password of 8 to 128 characters.", "password");
  if (password !== confirm) return formError("The passwords do not match.", "confirm");
  if (!userTypes.includes(userType as (typeof userTypes)[number])) {
    return formError("Choose retailer, contractor, or consumer.", "userType");
  }

  const [mobileTaken] = await db.select({ id: users.id }).from(users).where(eq(users.mobile, mobile)).limit(1);
  if (mobileTaken) return formError("An account already uses this mobile number.", "mobile");
  if (email) {
    const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (emailTaken) return formError("An account already uses this email.", "email");
  }

  const userId = newId();
  const photo = formData.get("photo");
  let stored: { url: string; key: string } | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      stored = await storeImage(photo, { folder: "users", id: userId });
    } catch (error) {
      return formError(error instanceof Error ? error.message : "The photo could not be saved.", "photo");
    }
  }

  try {
    await db.insert(users).values({
      id: userId,
      name,
      mobile,
      email,
      city,
      passwordHash: hashPassword(password),
      userType: userType as (typeof userTypes)[number],
      status: userType === "contractor" ? "pending" : "active",
      photoUrl: stored?.url ?? null,
      photoKey: stored?.key ?? null,
    });
  } catch (error) {
    if (stored) await removeStoredImage(stored.url, stored.key);
    const duplicate = error instanceof Error ? error.message : "";
    if (/mobile/i.test(duplicate)) return formError("An account already uses this mobile number.", "mobile");
    if (/email/i.test(duplicate)) return formError("An account already uses this email.", "email");
    return formError("The account could not be created.");
  }

  const next = catalogueReturnPath(formData.get("next"));
  if (userType === "contractor") {
    redirect(next ? `/login?notice=pending&next=${encodeURIComponent(next)}` : "/login?notice=pending");
  }
  await createUserSession(userId);
  redirect(next ?? "/account");
}

export async function loginUser(_previous: { error: string; field?: string } | null, formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const email = identifier.includes("@") ? identifier.toLowerCase() : null;
  const mobile = email ? null : normalizeMobile(identifier);

  if (!email && !mobile) return formError("Enter the mobile number or email on the account.", "identifier");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return formError("Enter a valid email address.", "identifier");

  const [user] = await db
    .select()
    .from(users)
    .where(email ? eq(users.email, email) : eq(users.mobile, mobile!))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return formError("Mobile, email, or password is incorrect.", "password");
  }
  if (user.status !== "active") return formError(signInDenial(user.status));

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createUserSession(user.id);
  redirect(catalogueReturnPath(formData.get("next")) ?? "/account");
}

export async function logoutUser() {
  await destroyUserSession();
  redirect("/");
}

export async function updateProfile(_previous: { error: string; field?: string } | null, formData: FormData) {
  const account = await getUserSession();
  if (!account) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const email = cleanEmail(formData.get("email"));
  const city = String(formData.get("city") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (name.length < 2) return formError("Enter your full name.", "name");
  if (name.length > 160) return formError("Name must be 160 characters or fewer.", "name");
  if (email === undefined) return formError("Enter a valid email, or leave it blank.", "email");
  if (email && email.length > 255) return formError("Email must be 255 characters or fewer.", "email");
  if (city.length < 2) return formError("Enter your city.", "city");
  if (city.length > 120) return formError("City must be 120 characters or fewer.", "city");
  if (password || confirm) {
    if (password.length < 8 || password.length > 128) return formError("Use a password of 8 to 128 characters.", "password");
    if (password !== confirm) return formError("The passwords do not match.", "confirm");
  }

  if (email) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, account.id)))
      .limit(1);
    if (taken) return formError("Another account already uses this email.", "email");
  }

  const photo = formData.get("photo");
  let photoUrl = account.photoUrl;
  let photoKey = account.photoKey;
  let previous: { url: string | null; key: string | null } | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      const stored = await storeImage(photo, { folder: "users", id: account.id });
      previous = { url: account.photoUrl, key: account.photoKey };
      photoUrl = stored.url;
      photoKey = stored.key;
    } catch (error) {
      return formError(error instanceof Error ? error.message : "The photo could not be saved.", "photo");
    }
  }

  await db
    .update(users)
    .set({
      name,
      email,
      city,
      photoUrl,
      photoKey,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    })
    .where(eq(users.id, account.id));

  if (previous) await removeStoredImage(previous.url, previous.key);
  revalidatePath("/account");
  redirect("/account?saved=1");
}
