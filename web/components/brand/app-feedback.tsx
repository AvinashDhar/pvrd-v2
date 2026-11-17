"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { beginAppNavigation, endAppNavigation, subscribeAppNavigation } from "@/components/brand/navigation-signal";

const MIN_BAR_MS = 450;

const TAP_SELECTOR = [
  "a[href]",
  "button",
  "summary",
  "select",
  "input[type='submit']",
  "input[type='button']",
  "input[type='checkbox']",
  "input[type='radio']",
  "[role='button']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='radio']",
].join(",");

function isDisabled(control: Element) {
  if (control.getAttribute("aria-disabled") === "true") return true;
  if (
    control instanceof HTMLButtonElement ||
    control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement
  ) {
    return control.disabled;
  }
  return false;
}

function flash(control: Element) {
  control.classList.remove("pvrd-tap");
  void (control as HTMLElement).offsetWidth;
  control.classList.add("pvrd-tap");
  window.setTimeout(() => control.classList.remove("pvrd-tap"), 340);
}

function NavigationBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  const seenKey = useRef(key);
  const startedAt = useRef(0);
  const finishTimer = useRef(0);
  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");

  const scheduleFinish = useCallback(() => {
    window.clearTimeout(finishTimer.current);
    const wait = Math.max(0, MIN_BAR_MS - (Date.now() - startedAt.current));
    finishTimer.current = window.setTimeout(() => {
      setPhase((current) => (current === "run" ? "done" : current));
    }, wait);
  }, []);

  useEffect(() => {
    return subscribeAppNavigation((active) => {
      if (active) {
        window.clearTimeout(finishTimer.current);
        startedAt.current = Date.now();
        setPhase("run");
        return;
      }
      scheduleFinish();
    });
  }, [scheduleFinish]);

  useEffect(() => () => window.clearTimeout(finishTimer.current), []);

  useEffect(() => {
    if (seenKey.current === key) return;
    seenKey.current = key;
    scheduleFinish();
  }, [key, scheduleFinish]);

  useEffect(() => {
    if (phase !== "run") return;
    const timer = window.setTimeout(() => setPhase("done"), 12000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    const timer = window.setTimeout(() => setPhase("idle"), 280);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith("/api/")) return;
      beginAppNavigation(`${url.pathname}${url.search}`);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const field = target.closest("input, textarea, select");
      if (field instanceof HTMLInputElement && !["checkbox", "radio", "submit", "button"].includes(field.type)) return;
      if (field instanceof HTMLTextAreaElement) return;
      const control = target.closest(TAP_SELECTOR) ?? target.closest("label");
      if (!control || isDisabled(control)) return;
      flash(control);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  if (phase === "idle") return null;

  return (
    <div className="pvrd-progress" data-feedback-chrome="" aria-hidden="true">
      <div className="pvrd-progress-bar" data-phase={phase} />
    </div>
  );
}

export function AppFeedback() {
  return (
    <Suspense fallback={null}>
      <NavigationBar />
    </Suspense>
  );
}

export { beginAppNavigation, endAppNavigation };
