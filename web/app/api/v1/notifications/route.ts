import { NextResponse } from "next/server";
import { absoluteUrl, apiError, requestAccount } from "@/lib/api/http";
import { listInbox, markNotificationsRead } from "@/lib/notifications/inbox";

export async function GET(request: Request) {
  const access = await requestAccount(request);
  if (access.response) return access.response;
  if (!access.account) return apiError("Sign in to view notifications.", 401);

  const items = await listInbox(access.account);
  return NextResponse.json({
    unread: items.filter((item) => !item.read).length,
    data: items.map((item) => presentNotification(item, request)),
  });
}

export async function POST(request: Request) {
  const access = await requestAccount(request);
  if (access.response) return access.response;
  if (!access.account) return apiError("Sign in to update notifications.", 401);

  const body = await request.json().catch(() => null);
  const requested = body && typeof body === "object" && "id" in body ? String(body.id ?? "") : "";
  const all = Boolean(body && typeof body === "object" && "all" in body && body.all);
  const inbox = await listInbox(access.account);
  const ids = all ? inbox.filter((item) => !item.read).map((item) => item.id) : requested ? [requested] : [];
  if (!all && requested && !inbox.some((item) => item.id === requested)) {
    return apiError("Notification was not found.", 404);
  }
  await markNotificationsRead(access.account, ids);

  const items = await listInbox(access.account);
  return NextResponse.json({
    unread: items.filter((item) => !item.read).length,
    data: items.map((item) => presentNotification(item, request)),
  });
}

function presentNotification(
  item: {
    id: string;
    title: string;
    message: string;
    imageUrl: string | null;
    type: string;
    linkId: string | null;
    redirectUrl: string | null;
    read: boolean;
    createdAt: Date | string;
  },
  request: Request,
) {
  const redirectUrl = item.redirectUrl?.startsWith("/")
    ? absoluteUrl(request, item.redirectUrl)
    : item.redirectUrl;
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    image: absoluteUrl(request, item.imageUrl),
    type: item.type,
    productId: item.type === "product_launch" ? item.linkId : null,
    redirectUrl,
    read: item.read,
    createdAt: new Date(item.createdAt).toISOString(),
  };
}
