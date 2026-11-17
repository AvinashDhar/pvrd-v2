"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

type Frame = { scale: number; x: number; y: number };

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const slides = images.filter(Boolean);
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const drag = useRef({ x: 0, moved: false });

  if (slides.length === 0) return null;

  const multiple = slides.length > 1;
  const current = Math.min(index, slides.length - 1);

  function go(next: number) {
    const el = scroller.current;
    const clamped = Math.min(slides.length - 1, Math.max(0, next));
    if (!el) {
      setIndex(clamped);
      return;
    }
    el.scrollTo({
      left: clamped * el.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    setIndex(clamped);
  }

  return (
    <div className="pvrd-card overflow-hidden bg-white">
      <div
        className="relative"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${alt} images`}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(current - 1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            go(current + 1);
          }
        }}
      >
        <div
          ref={scroller}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x_pan-y] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const el = event.currentTarget;
            if (el.clientWidth === 0) return;
            const next = Math.round(el.scrollLeft / el.clientWidth);
            setIndex((value) => (value === next ? value : next));
          }}
          onPointerDown={(event) => {
            drag.current = { x: event.clientX, moved: false };
          }}
          onPointerMove={(event) => {
            if (Math.abs(event.clientX - drag.current.x) > 8) drag.current.moved = true;
          }}
        >
          {slides.map((src, slide) => (
            <button
              key={`${src}-${slide}`}
              type="button"
              className="relative aspect-[4/3] w-full shrink-0 snap-center bg-white lg:aspect-square"
              aria-label={`View larger image ${slide + 1} of ${slides.length}`}
              onClick={() => {
                if (drag.current.moved) {
                  drag.current.moved = false;
                  return;
                }
                setViewer(slide);
              }}
            >
              <Image
                src={src}
                alt={slide === current ? alt : ""}
                fill
                priority={slide === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-[8%] sm:p-[10%]"
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="absolute top-3 left-3 z-10 grid size-11 place-items-center rounded-full border border-black/10 bg-white text-primary shadow-md"
          aria-label="Zoom image"
          onClick={() => setViewer(current)}
        >
          <ZoomIn className="size-5" />
        </button>
        {multiple ? (
          <>
            <p className="pointer-events-none absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm">
              {current + 1} / {slides.length}
            </p>
            <button
              type="button"
              aria-label="Previous image"
              className="absolute top-1/2 left-3 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-primary shadow-md disabled:opacity-40"
              onClick={() => go(current - 1)}
              disabled={current === 0}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              className="absolute top-1/2 right-3 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-primary shadow-md disabled:opacity-40"
              onClick={() => go(current + 1)}
              disabled={current === slides.length - 1}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>
      {multiple ? (
        <div className="flex items-center justify-center gap-1.5 pt-3" aria-hidden="true">
          {slides.map((src, dot) => (
            <span
              key={`${src}-dot-${dot}`}
              className={cn("h-1.5 rounded-full bg-primary/25", dot === current ? "w-5 bg-lime" : "w-1.5")}
            />
          ))}
        </div>
      ) : null}
      {multiple ? (
        <div className="flex gap-2 overflow-x-auto px-3 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {slides.map((src, thumb) => {
            const selected = thumb === current;
            return (
              <button
                key={`${src}-thumb-${thumb}`}
                type="button"
                aria-label={`Show image ${thumb + 1}`}
                aria-current={selected ? "true" : undefined}
                onClick={() => go(thumb)}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white",
                  selected ? "border-primary" : "border-transparent",
                )}
              >
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
      {viewer != null ? (
        <ImageViewer
          images={slides}
          alt={alt}
          start={viewer}
          onClose={(next) => {
            setViewer(null);
            go(next);
          }}
        />
      ) : null}
    </div>
  );
}

function ImageViewer({
  images,
  alt,
  start,
  onClose,
}: {
  images: string[];
  alt: string;
  start: number;
  onClose: (index: number) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const frames = useRef<(HTMLImageElement | null)[]>([]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const pan = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const view = useRef<Frame & { index: number }>({ scale: 1, x: 0, y: 0, index: start });
  const lastTap = useRef(0);
  const pinched = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(start);
  const [label, setLabel] = useState(100);
  const [mounted, setMounted] = useState(false);

  function paint(animate: boolean) {
    const node = frames.current[view.current.index];
    if (!node) return;
    node.style.transition = animate ? "transform 180ms ease" : "none";
    const { scale, x, y } = view.current;
    node.style.transform = scale === 1 && x === 0 && y === 0 ? "none" : `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  function lockScroll(locked: boolean) {
    const el = scroller.current;
    if (!el) return;
    el.style.overflowX = locked ? "hidden" : "auto";
  }

  function setScale(next: number, animate: boolean) {
    const scale = clamp(next, MIN_SCALE, MAX_SCALE);
    view.current.scale = scale;
    if (scale === 1) {
      view.current.x = 0;
      view.current.y = 0;
      lockScroll(false);
    } else {
      lockScroll(true);
    }
    paint(animate);
    setLabel(Math.round(scale * 100));
  }

  function show(next: number) {
    const el = scroller.current;
    const clamped = Math.min(images.length - 1, Math.max(0, next));
    setScale(1, false);
    el?.scrollTo({
      left: clamped * (el.clientWidth || 1),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = scroller.current;
    const place = () => {
      if (el) el.scrollLeft = start * el.clientWidth;
    };
    place();
    const frame = requestAnimationFrame(place);
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(view.current.index);
      else if (event.key === "ArrowLeft") show(view.current.index - 1);
      else if (event.key === "ArrowRight") show(view.current.index + 1);
      else if (event.key === "+" || event.key === "=") setScale(view.current.scale * 1.25, true);
      else if (event.key === "-" || event.key === "_") setScale(view.current.scale / 1.25, true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
    // Bind once the portal is on screen. Refs keep the handlers current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const node = scroller.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setScale(view.current.scale * (event.deltaY < 0 ? 1.12 : 0.89), false);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} image viewer`}
      className="fixed inset-0 z-[220] flex flex-col bg-black text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          ref={closeRef}
          type="button"
          className="grid size-11 place-items-center rounded-full bg-white/15"
          aria-label="Close image viewer"
          onClick={() => onClose(view.current.index)}
        >
          <X className="size-5" />
        </button>
        <p className="text-sm font-medium" aria-live="polite">
          {index + 1} / {images.length}
          <span className="sr-only">, zoom {label} percent</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white/15 disabled:opacity-40"
            aria-label="Zoom out"
            disabled={label <= 100}
            onClick={() => setScale(view.current.scale / 1.25, true)}
          >
            <ZoomOut className="size-5" />
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white/15 disabled:opacity-40"
            aria-label="Zoom in"
            disabled={label >= 400}
            onClick={() => setScale(view.current.scale * 1.25, true)}
          >
            <ZoomIn className="size-5" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth [touch-action:pan-x] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={(event) => {
          if (event.target instanceof Element && event.target.closest("button")) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size >= 2 || view.current.scale > 1) {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          if (view.current.scale > 1) {
            pan.current = { x: event.clientX, y: event.clientY, ox: view.current.x, oy: view.current.y };
          }
        }}
        onPointerMove={(event) => {
          const point = pointers.current.get(event.pointerId);
          if (!point) return;
          point.x = event.clientX;
          point.y = event.clientY;
          const pts = [...pointers.current.values()];
          if (pts.length >= 2) {
            const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (!pinch.current) {
              pinch.current = { distance, scale: view.current.scale };
              pinched.current = true;
              lockScroll(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }
            const next = clamp(pinch.current.scale * (distance / pinch.current.distance), MIN_SCALE, MAX_SCALE);
            view.current.scale = next;
            if (next === 1) {
              view.current.x = 0;
              view.current.y = 0;
            }
            paint(false);
            return;
          }
          if (view.current.scale > 1 && pan.current) {
            const bounds = scroller.current?.getBoundingClientRect();
            const maxX = ((view.current.scale - 1) * (bounds?.width ?? 0)) / 2;
            const maxY = ((view.current.scale - 1) * (bounds?.height ?? 0)) / 2;
            view.current.x = clamp(pan.current.ox + event.clientX - pan.current.x, -maxX, maxX);
            view.current.y = clamp(pan.current.oy + event.clientY - pan.current.y, -maxY, maxY);
            paint(false);
          }
        }}
        onPointerUp={(event) => {
          const startPoint = pointers.current.get(event.pointerId);
          pointers.current.delete(event.pointerId);
          if (pointers.current.size < 2) pinch.current = null;
          if (pointers.current.size > 0) return;
          pan.current = null;
          if (view.current.scale <= 1.02) {
            view.current.scale = 1;
            view.current.x = 0;
            view.current.y = 0;
            paint(true);
            lockScroll(false);
          }
          setLabel(Math.round(view.current.scale * 100));
          if (pinched.current) {
            pinched.current = false;
            return;
          }
          if (!startPoint) return;
          const moved = Math.hypot(event.clientX - startPoint.x, event.clientY - startPoint.y);
          if (moved > 12) return;
          const now = Date.now();
          if (now - lastTap.current < 280) {
            setScale(view.current.scale > 1 ? 1 : 2.5, true);
            lastTap.current = 0;
          } else {
            lastTap.current = now;
          }
        }}
        onPointerCancel={() => {
          pointers.current.clear();
          pinch.current = null;
          pan.current = null;
        }}
        onScroll={(event) => {
          const el = event.currentTarget;
          if (el.clientWidth === 0) return;
          const next = Math.round(el.scrollLeft / el.clientWidth);
          if (next === view.current.index) return;
          const previous = frames.current[view.current.index];
          if (previous) previous.style.transform = "none";
          view.current = { scale: 1, x: 0, y: 0, index: next };
          setIndex(next);
          setLabel(100);
          lockScroll(false);
        }}
      >
        {images.map((src, slide) => (
          <div key={`${src}-${slide}`} className="flex w-full shrink-0 snap-center items-center justify-center">
            {/* Full-resolution photo so pinch zoom stays sharp. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(node) => {
                frames.current[slide] = node;
              }}
              src={src}
              alt={slide === index ? alt : ""}
              draggable={false}
              className="max-h-[78vh] max-w-[94vw] object-contain select-none"
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white/15 disabled:opacity-40"
            aria-label="Previous image"
            disabled={index === 0}
            onClick={() => show(index - 1)}
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex gap-2 overflow-x-auto">
            {images.map((src, thumb) => (
              <button
                key={`${src}-viewer-${thumb}`}
                type="button"
                aria-label={`Show image ${thumb + 1}`}
                aria-current={thumb === index ? "true" : undefined}
                onClick={() => show(thumb)}
                className={cn(
                  "relative size-12 shrink-0 overflow-hidden rounded-lg border-2",
                  thumb === index ? "border-lime" : "border-transparent opacity-70",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white/15 disabled:opacity-40"
            aria-label="Next image"
            disabled={index === images.length - 1}
            onClick={() => show(index + 1)}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      ) : (
        <p className="px-4 pb-4 text-center text-xs text-white/70">Pinch, scroll, or double-tap to zoom</p>
      )}
    </div>,
    document.body,
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
