"use client";

import { useEffect } from "react";
import { showNotice } from "@/components/admin/notice-toast";
import { FLASH_COOKIE, type FlashNotice } from "@/lib/flash-notice";

const seen = new Set<string>();

export function FlashToast({ notice }: { notice: FlashNotice | null }) {
  useEffect(() => {
    if (!notice || seen.has(notice.id)) return;
    seen.add(notice.id);
    showNotice(notice.tone, notice.message, notice.id);
    document.cookie = `${FLASH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }, [notice]);

  return null;
}
