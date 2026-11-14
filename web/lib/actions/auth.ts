"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession, destroyAdminSession } from "@/lib/auth/session";
import { formError } from "@/lib/forms";

export async function login(_previous: { error: string; field?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return formError("Enter a valid email address.", "email");

  const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return formError("Email or password is incorrect.", "password");
  }

  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function logout() {
  await destroyAdminSession();
  redirect("/login/admin");
}
