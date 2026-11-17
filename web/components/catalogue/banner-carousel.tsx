"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BannerSlide = {
  id: string;
  title: string;
  image: string;
  href: string;
};

const AUTOPLAY_MS = 5500;

export function BannerCarousel({
  banners,
  variant = "band",
}: {
  banners: BannerSlide[];
  variant?: "band" | "panel";
}) {
  const count = banners.length;
  const loop = count > 1;
  const slides = loop ? [banners[count - 1], ...banners, banners[0]] : banners;
  const [index, setIndex] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const drag = useRef({ x: 0, moved: false });
  const regionRef = useRef<HTMLElement>(null);

  const panel = variant === "panel";
  const realIndex = loop ? (index === 0 ? count - 1 : index === count + 1 ? 0 : index - 1) : 0;

  const settle = useCallback(() => {
    if (!loop) return;
    if (index === slides.length - 1) {
      setAnimate(false);
      setIndex(1);
    } else if (index === 0) {
      setAnimate(false);
      setIndex(count);
    }
  }, [count, index, loop, slides.length]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (animate) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [animate, index]);

  useEffect(() => {
    if (!loop || paused || reduceMotion) return;
    let timer = 0;
    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      timer = window.setInterval(() => {
        setAnimate(true);
        setIndex((current) => current + 1);
      }, AUTOPLAY_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loop, paused, reduceMotion]);

  function step(direction: -1 | 1) {
    if (!loop) return;
    setAnimate(true);
    setIndex((current) => current + direction);
  }

  function goTo(target: number) {
    if (!loop) return;
    setAnimate(true);
    setIndex(target + 1);
  }

  return (
    <section
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label="Promotions"
      className={panel ? "relative min-w-0" : "bg-white"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          step(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          step(1);
        }
      }}
    >
      <div className={panel ? "relative lg:px-6" : "relative mx-auto w-full max-w-6xl sm:px-6 sm:pt-4 lg:px-16"}>
        <div
          className={cn(
            "relative overflow-hidden bg-[#f3f6f9]",
            panel ? "rounded-2xl shadow-[var(--shadow-card)]" : "sm:rounded-2xl sm:shadow-[var(--shadow-card)]",
          )}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            drag.current = { x: event.clientX, moved: false };
          }}
          onPointerUp={(event) => {
            const delta = event.clientX - drag.current.x;
            if (Math.abs(delta) < 48) return;
            drag.current.moved = true;
            step(delta < 0 ? 1 : -1);
          }}
          onClickCapture={(event) => {
            if (!drag.current.moved) return;
            event.preventDefault();
            event.stopPropagation();
            drag.current.moved = false;
          }}
        >
          <div
            className={cn("flex", animate && !reduceMotion && "transition-transform duration-500 ease-out")}
            style={{ transform: `translateX(-${index * 100}%)` }}
            onTransitionEnd={settle}
          >
            {slides.map((banner, slideIndex) => {
              const external = /^https?:\/\//i.test(banner.href);
              const frame = (
                <span className="relative block aspect-[16/9] w-full">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    priority={slideIndex === (loop ? 1 : 0)}
                    sizes={panel ? "(max-width: 1024px) 100vw, 860px" : "(max-width: 1152px) 100vw, 1152px"}
                    className="object-cover"
                  />
                </span>
              );
              return (
                <div key={`${banner.id}-${slideIndex}`} className="w-full shrink-0" aria-hidden={slideIndex !== index}>
                  {external ? (
                    <a href={banner.href} tabIndex={slideIndex === index ? 0 : -1}>
                      {frame}
                    </a>
                  ) : (
                    <Link href={banner.href} tabIndex={slideIndex === index ? 0 : -1}>
                      {frame}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {loop ? (
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                {banners.map((banner, dot) => {
                  const active = dot === realIndex;
                  return (
                    <button
                      key={banner.id}
                      type="button"
                      aria-label={`Show ${banner.title}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => goTo(dot)}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        active ? "w-6 bg-lime" : "w-2 bg-white/80 shadow-sm",
                      )}
                    />
                  );
                })}
            </div>
          ) : null}
        </div>
        {loop ? (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() => step(-1)}
              className={cn(
                "absolute z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-primary shadow-md transition hover:bg-lime lg:grid",
                panel ? "top-1/2 left-0" : "top-[calc(50%+0.5rem)] left-2",
              )}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={() => step(1)}
              className={cn(
                "absolute z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-primary shadow-md transition hover:bg-lime lg:grid",
                panel ? "top-1/2 right-0" : "top-[calc(50%+0.5rem)] right-2",
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
