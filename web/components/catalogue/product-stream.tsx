"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useSyncExternalStore, useState } from "react";
import { ProductCard, productGridClassName } from "@/components/catalogue/product-card";
import { loadCatalogueBatch } from "@/lib/catalogue/browse";
import { cn } from "@/lib/utils";

type CatalogueItem = Awaited<ReturnType<typeof loadCatalogueBatch>>["items"][number];
type CatalogueSort = "relevance" | "name" | "price-asc" | "price-desc";
type Frame = { columns: number; scrollMargin: number };

const serverFrame: Frame = { columns: 2, scrollMargin: 0 };
let frame = serverFrame;
let parent: HTMLDivElement | null = null;
const listeners = new Set<() => void>();

function columnsFor(width: number) {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  return 2;
}

function readFrame() {
  if (typeof window === "undefined") return serverFrame;
  const next = {
    columns: columnsFor(window.innerWidth),
    scrollMargin: parent?.offsetTop ?? 0,
  };
  if (next.columns === frame.columns && next.scrollMargin === frame.scrollMargin) return frame;
  frame = next;
  return frame;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onResize = () => {
    const previous = frame;
    readFrame();
    if (frame !== previous) listeners.forEach((item) => item());
  };
  window.addEventListener("resize", onResize);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("resize", onResize);
  };
}

function attachParent(node: HTMLDivElement | null) {
  parent = node;
  const previous = frame;
  readFrame();
  if (frame !== previous) listeners.forEach((listener) => listener());
}

export function ProductStream({
  initialItems,
  total,
  trade,
  query,
  category,
  sort,
}: {
  initialItems: CatalogueItem[];
  total: number;
  trade: boolean;
  query?: string;
  category?: string;
  sort: CatalogueSort;
}) {
  const layout = useSyncExternalStore(subscribe, readFrame, () => serverFrame);
  const [items, setItems] = useState(initialItems);
  const [totalCount, setTotalCount] = useState(total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(initialItems.length);
  const totalRef = useRef(total);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || offsetRef.current >= totalRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const page = await loadCatalogueBatch({
        q: query,
        category,
        sort,
        offset: offsetRef.current,
      });
      totalRef.current = page.total;
      setTotalCount(page.total);
      if (page.items.length === 0) {
        offsetRef.current = page.total;
        return;
      }
      offsetRef.current += page.items.length;
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        const next = page.items.filter((item) => !seen.has(item.id));
        return next.length ? [...current, ...next] : current;
      });
    } catch {
      setError("More products could not be loaded.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [category, loadingRef, offsetRef, query, sort, totalRef]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || items.length >= totalCount) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "800px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length, loadMore, sentinelRef, totalCount]);

  return (
    <div className="mt-3 sm:mt-6">
      <p className="mb-3 px-2 text-sm text-muted-foreground sm:px-0">
        {items.length} of {totalCount}
      </p>
      <div ref={attachParent} className="px-2 sm:px-0" style={{ overflowAnchor: "none" }}>
        <VirtualRows
          key={layout.columns}
          items={items}
          columns={layout.columns}
          scrollMargin={layout.scrollMargin}
          trade={trade}
        />
      </div>
      <div ref={sentinelRef} className="h-px" />
      {loading ? <p className="px-2 py-4 text-center text-sm text-muted-foreground sm:px-0">Loading more…</p> : null}
      {error ? (
        <p className="px-2 py-4 text-center text-sm text-muted-foreground sm:px-0">
          {error}{" "}
          <button type="button" className="font-semibold text-primary" onClick={() => void loadMore()}>
            Try again
          </button>
        </p>
      ) : null}
    </div>
  );
}

function VirtualRows({
  items,
  columns,
  scrollMargin,
  trade,
}: {
  items: CatalogueItem[];
  columns: number;
  scrollMargin: number;
  trade: boolean;
}) {
  const rows = Math.ceil(items.length / columns) || 0;
  const virtualizer = useWindowVirtualizer({
    count: rows,
    estimateSize: () => (columns > 2 ? 360 : 300),
    overscan: 3,
    scrollMargin,
    gap: 16,
    initialRect: { width: 390, height: 900 },
  });

  return (
    <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {virtualizer.getVirtualItems().map((row) => {
        const slice = items.slice(row.index * columns, row.index * columns + columns);
        return (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className={cn(productGridClassName, "lg:grid-cols-3 xl:grid-cols-4")}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${row.start - scrollMargin}px)`,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {slice.map((product) => (
              <ProductCard key={product.id} product={product} trade={trade} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
