"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { listInbox, markNotificationsRead } from "@/lib/notifications/inbox";

function refresh() {
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function openNotification(formData: FormData) {
  const account = await getUserSession();
  if (!account) redirect("/login?next=/notifications");
  const id = String(formData.get("id") ?? "");
  const item = (await listInbox(account)).find((row) => row.id === id);
  if (!item) redirect("/notifications");
  await markNotificationsRead(account, [id]);
  refresh();
  redirect(item.redirectUrl?.startsWith("/") ? item.redirectUrl : "/notifications");
}

export async function markAllNotificationsRead() {
  const account = await getUserSession();
  if (!account) redirect("/login?next=/notifications");
  const unread = (await listInbox(account)).filter((row) => !row.read).map((row) => row.id);
  await markNotificationsRead(account, unread);
  refresh();
}
