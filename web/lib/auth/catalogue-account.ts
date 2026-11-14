import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { newId, userTypes, users, type UserType } from "@/lib/db/schema";
import { normalizeMobile, signInDenial } from "@/lib/auth/access";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { CatalogueAccount } from "@/lib/auth/session";
import { formError } from "@/lib/forms";

type AccountFailure = { error: string; field?: string };
import { removeStoredImage, storeImage } from "@/lib/storage/images";

export function cleanEmail(value: string | null | undefined) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return email;
}

function photoFile(file: File | null | undefined) {
  return file instanceof File && file.size > 0 ? file : null;
}

export async function registerCatalogueAccount(input: {
  name: string;
  mobile: string;
  email: string | null | undefined;
  city: string;
  password: string;
  confirm: string;
  userType: string;
  photo?: File | null;
}): Promise<AccountFailure | { userId: string; userType: UserType; status: "pending" | "active" }> {
  const name = input.name.trim();
  const mobile = normalizeMobile(input.mobile);
  const email = input.email;
  const city = input.city.trim();
  const password = input.password;
  const userType = input.userType;

  if (name.length < 2) return formError("Enter your full name.", "name");
  if (name.length > 160) return formError("Name must be 160 characters or fewer.", "name");
  if (!mobile) return formError("Enter a valid 10-digit mobile number.", "mobile");
  if (email === undefined) return formError("Enter a valid email, or leave it blank.", "email");
  if (email && email.length > 255) return formError("Email must be 255 characters or fewer.", "email");
  if (city.length < 2) return formError("Enter your city.", "city");
  if (city.length > 120) return formError("City must be 120 characters or fewer.", "city");
  if (password.length < 8 || password.length > 128) return formError("Use a password of 8 to 128 characters.", "password");
  if (password !== input.confirm) return formError("The passwords do not match.", "confirm");
  if (!userTypes.includes(userType as UserType)) {
    return formError("Choose retailer, contractor, or consumer.", "userType");
  }

  const [mobileTaken] = await db.select({ id: users.id }).from(users).where(eq(users.mobile, mobile)).limit(1);
  if (mobileTaken) return formError("An account already uses this mobile number.", "mobile");
  if (email) {
    const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (emailTaken) return formError("An account already uses this email.", "email");
  }

  const userId = newId();
  const photo = photoFile(input.photo);
  let stored: { url: string; key: string } | null = null;
  if (photo) {
    try {
      stored = await storeImage(photo, { folder: "users", id: userId });
    } catch (error) {
      return formError(error instanceof Error ? error.message : "The photo could not be saved.", "photo");
    }
  }

  const status = userType === "contractor" ? "pending" : "active";
  try {
    await db.insert(users).values({
      id: userId,
      name,
      mobile,
      email,
      city,
      passwordHash: hashPassword(password),
      userType: userType as UserType,
      status,
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

  return { userId, userType: userType as UserType, status };
}

export async function authenticateCatalogueAccount(identifier: string, password: string) {
  const trimmed = identifier.trim();
  const email = trimmed.includes("@") ? trimmed.toLowerCase() : null;
  const mobile = email ? null : normalizeMobile(trimmed);

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
  return { userId: user.id };
}

export async function updateCatalogueProfile(
  account: CatalogueAccount,
  input: {
    name: string;
    email: string | null | undefined;
    city: string;
    password: string;
    confirm: string;
    photo?: File | null;
  },
) {
  const name = input.name.trim();
  const email = input.email;
  const city = input.city.trim();
  const password = input.password;
  const confirm = input.confirm;

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

  const photo = photoFile(input.photo);
  let photoUrl = account.photoUrl;
  let photoKey = account.photoKey;
  let previous: { url: string | null; key: string | null } | null = null;
  if (photo) {
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
  return { ok: true as const };
}
