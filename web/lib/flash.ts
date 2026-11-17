import { cookies } from "next/headers";
import { FLASH_COOKIE, type FlashNotice } from "@/lib/flash-notice";

export async function flash(tone: FlashNotice["tone"], message: string) {
  const text = message.trim().slice(0, 180);
  if (!text) return;
  const notice: FlashNotice = { id: crypto.randomUUID(), tone, message: text };
  const jar = await cookies();
  jar.set(FLASH_COOKIE, JSON.stringify(notice), {
    path: "/",
    maxAge: 20,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readFlash(): Promise<FlashNotice | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FlashNotice>;
    if (parsed.tone !== "success" && parsed.tone !== "error") return null;
    if (typeof parsed.message !== "string" || typeof parsed.id !== "string") return null;
    const message = parsed.message.trim().slice(0, 180);
    if (!message || parsed.id.length > 80) return null;
    return { id: parsed.id, tone: parsed.tone, message };
  } catch {
    return null;
  }
}
