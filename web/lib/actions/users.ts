"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { accountStatuses, userSessions, users, type AccountStatus } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { removeStoredImage } from "@/lib/storage/images";
import type { ActionNotice } from "@/lib/forms";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  return session;
}

export async function setUserStatus(formData: FormData): Promise<ActionNotice | void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!accountStatuses.includes(status as AccountStatus)) return { error: "Choose a valid account status." };
  if (status === "blocked" && reason.length < 3) {
    return { error: "A block needs a short reason." };
  }

  await db
    .update(users)
    .set({
      status: status as AccountStatus,
      blockReason: status === "blocked" ? reason : null,
    })
    .where(eq(users.id, id));

  if (status !== "active") {
    await db.delete(userSessions).where(eq(userSessions.userId, id));
  }

  revalidatePath("/admin/users");
  if (status === "blocked") return { message: "Account blocked." };
  if (status === "inactive") return { message: "Account deactivated." };
  return { message: "Account is active." };
}

export async function deleteCatalogueUser(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const [user] = await db
    .select({ photoUrl: users.photoUrl, photoKey: users.photoKey })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) return { error: "That user is no longer available." };

  await db.delete(users).where(eq(users.id, id));
  await removeStoredImage(user.photoUrl, user.photoKey);
  revalidatePath("/admin/users");
  return { message: "User deleted." };
}
