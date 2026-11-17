"use client";

import { toast } from "sonner";

export function showNotice(tone: "success" | "error", message: string, id?: string) {
  const text = message.trim();
  if (!text) return;
  const toastId = id ?? `${tone}:${text}`;
  if (tone === "error") toast.error(text, { id: toastId, duration: 5200 });
  else toast.success(text, { id: toastId, duration: 3200 });
}
