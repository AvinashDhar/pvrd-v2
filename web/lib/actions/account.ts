"use server";

import { and, eq, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { newId, userTypes, users } from "@/lib/db/schema";
import { normalizeMobile, signInDenial } from "@/lib/auth/access";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createUserSession, destroyUserSession, getUserSession } from "@/lib/auth/session";
import { removeStoredImage, storeImage } from "@/lib/storage/images";

function cleanEmail(value: FormDataEntryValue | null) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return email;
}

export async function signup(_previous: { error: string } | null, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const mobile = normalizeMobile(String(formData.get("mobile") ?? ""));
  const email = cleanEmail(formData.get("email"));
  const city = String(formData.get("city") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const userType = String(formData.get("userType") ?? "");

  if (name.length < 2) return { error: "Enter your full name." };
  if (!mobile) return { error: "Enter a valid 10-digit mobile number." };
  if (email === undefined) return { error: "Enter a valid email, or leave it blank." };
  if (city.length < 2) return { error: "Enter your city." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (password !== confirm) return { error: "The passwords do not match." };
  if (!userTypes.includes(userType as (typeof userTypes)[number])) {
    return { error: "Choose retailer, contractor, or consumer." };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(email ? or(eq(users.mobile, mobile), eq(users.email, email)) : eq(users.mobile, mobile))
    .limit(1);
  if (existing.length > 0) return { error: "An account already uses this mobile number or email." };

  const userId = newId();
  const photo = formData.get("photo");
  let stored: { url: string; key: string } | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      stored = await storeImage(photo, { folder: "users", id: userId });
    } catch (error) {
      return { error: error instanceof Error ? error.message : "The photo could not be saved." };
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
    return { error: error instanceof Error ? error.message : "The account could not be created." };
  }

  if (userType === "contractor") redirect("/login?notice=pending");
  await createUserSession(userId);
  redirect("/account");
}

export async function loginUser(_previous: { error: string } | null, formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const email = identifier.includes("@") ? identifier.toLowerCase() : null;
  const mobile = email ? null : normalizeMobile(identifier);

  if (!email && !mobile) return { error: "Enter the mobile number or email on the account." };

  const [user] = await db
    .select()
    .from(users)
    .where(email ? eq(users.email, email) : eq(users.mobile, mobile!))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Mobile, email, or password is incorrect." };
  }
  if (user.status !== "active") return { error: signInDenial(user.status) };

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createUserSession(user.id);
  redirect("/account");
}

export async function logoutUser() {
  await destroyUserSession();
  redirect("/");
}

export async function updateProfile(_previous: { error: string } | null, formData: FormData) {
  const account = await getUserSession();
  if (!account) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const email = cleanEmail(formData.get("email"));
  const city = String(formData.get("city") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (name.length < 2) return { error: "Enter your full name." };
  if (email === undefined) return { error: "Enter a valid email, or leave it blank." };
  if (city.length < 2) return { error: "Enter your city." };
  if (password || confirm) {
    if (password.length < 8) return { error: "Use a password of at least 8 characters." };
    if (password !== confirm) return { error: "The passwords do not match." };
  }

  if (email) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, account.id)))
      .limit(1);
    if (taken) return { error: "Another account already uses this email." };
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
      return { error: error instanceof Error ? error.message : "The photo could not be saved." };
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
