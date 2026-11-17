"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PvrdLoader } from "@/components/brand/loader";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    __pvrdBoot?: number;
  }
}

const MIN_VISIBLE_MS = 1200;
const LEAVE_MS = 480;

export function SplashScreen() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = window.__pvrdBoot ?? Date.now();
    const wait = Math.max(0, (reduce ? 180 : MIN_VISIBLE_MS) - (Date.now() - started));
    let hideTimer = 0;
    const revealTimer = window.setTimeout(() => {
      if (reduce) {
        setPhase("gone");
        return;
      }
      setPhase("leave");
      hideTimer = window.setTimeout(() => setPhase("gone"), LEAVE_MS);
    }, wait);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === "gone") return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      className={cn("splash-screen", phase === "leave" && "splash-screen-leave")}
      role="status"
      aria-live="polite"
      aria-label="Loading OM PVRD"
    >
      <div className="splash-mark flex flex-col items-center">
        <Image
          src="/logo.png"
          alt=""
          width={940}
          height={508}
          priority
          className="h-auto w-[min(78vw,300px)] drop-shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
        />
        <PvrdLoader decorative className="mt-6 size-9 text-lime" />
        <p className="mt-3 text-center text-[11px] font-semibold tracking-[0.22em] text-white/75 uppercase">
          Loading the catalogue
        </p>
      </div>
    </div>
  );
}
