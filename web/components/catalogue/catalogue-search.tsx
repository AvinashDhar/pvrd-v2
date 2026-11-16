"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { MediaImage } from "@/components/catalogue/media-image";
import { formatINR } from "@/lib/format";

type SearchControls = {
  openSearch: (query?: string) => void;
};

type SearchProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  mrp: number;
  image: string;
  sku: string;
  price?: number;
};

const SearchContext = createContext<SearchControls | null>(null);

export function useCatalogueSearch() {
  const value = useContext(SearchContext);
  if (!value) throw new Error("Search is only available inside the catalogue.");
  return value;
}

export function CatalogueSearch({ children }: { children: ReactNode }) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [trade, setTrade] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const openSearch = useCallback((value = "") => {
    setQuery(value);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/v1/products?${new URLSearchParams({ q, limit: "24" })}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Search failed");
        const body = (await response.json()) as { data?: SearchProduct[]; trade?: boolean; total?: number };
        const rows = body.data ?? [];
        setResults(rows);
        setTotal(typeof body.total === "number" ? body.total : rows.length);
        setTrade(Boolean(body.trade));
        setStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, query]);

  const q = query.trim();
  const visibleResults = q ? results : [];
  const visibleTotal = q ? total : 0;
  const visibleStatus = q ? status : "idle";
  const countLabel =
    visibleStatus === "loading"
      ? "Searching…"
      : visibleStatus === "error"
        ? "Search could not be completed."
        : !q
          ? "Search name, SKU, description, finish, or size."
          : visibleTotal > visibleResults.length
            ? `${visibleResults.length} of ${visibleTotal} products`
            : `${visibleResults.length} ${visibleResults.length === 1 ? "product" : "products"}`;

  const searchControls = useMemo(() => ({ openSearch }), [openSearch]);

  return (
    <SearchContext.Provider value={searchControls}>
      {children}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="search-backdrop fixed inset-0 z-50 bg-[#001F3D]/45 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-open:duration-300 data-closed:animate-out data-closed:fade-out-0 data-closed:duration-200" />
          <DialogPrimitive.Popup
            initialFocus={() => inputRef.current}
            aria-labelledby={titleId}
            className="search-panel fixed inset-x-0 top-0 z-50 mx-auto flex max-h-dvh w-full max-w-3xl flex-col overflow-hidden rounded-b-3xl bg-white pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] shadow-[0_24px_80px_rgba(0,31,61,0.28)] outline-none data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-8 data-open:duration-500 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-top-4 data-closed:duration-200 sm:max-h-[min(100dvh,760px)]"
          >
            <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6">
              <DialogPrimitive.Title id={titleId} className="font-heading text-xl font-semibold text-primary">
                Search
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Close search"
                className="grid size-11 place-items-center rounded-full text-primary hover:bg-muted"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">
              Matching products appear over this page. Search includes name, SKU, description, finish, and size.
            </DialogPrimitive.Description>
            <form role="search" className="relative mx-4 mt-3 sm:mx-6" onSubmit={(event) => event.preventDefault()}>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && visibleResults.length > 0) {
                    event.preventDefault();
                    document.getElementById("search-result-0")?.focus();
                  }
                }}
                aria-label="Search the catalogue"
                aria-controls="search-results"
                placeholder="Search name, finish, size…"
                autoComplete="off"
                className="h-12 w-full rounded-full border border-[#003c6c]/12 bg-[#f3f6f9] pr-4 pl-11 text-base text-primary outline-none placeholder:text-muted-foreground focus:border-lime focus:ring-3 focus:ring-lime/30"
              />
            </form>
            <p className="px-5 pt-3 text-sm font-medium text-muted-foreground sm:px-7" aria-live="polite">
              {countLabel}
            </p>
            <div id="search-results" className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-4 sm:px-4">
              {visibleStatus === "error" ? (
                <p className="px-3 py-6 text-sm text-muted-foreground">The catalogue could not be searched. Try again.</p>
              ) : null}
              {visibleStatus === "ready" && visibleResults.length === 0 ? (
                <p className="px-3 py-6 text-sm text-muted-foreground">
                  No products match. Try a name, SKU, description, finish, or size.
                </p>
              ) : null}
              <ul className="grid gap-1">
                {visibleStatus === "ready"
                  ? visibleResults.map((product, index) => {
                      const amount = trade && typeof product.price === "number" ? product.price : product.mrp;
                      return (
                        <li key={product.id} className="search-result" style={{ animationDelay: `${Math.min(index, 8) * 36}ms` }}>
                          <Link
                            id={`search-result-${index}`}
                            href={`/products/${product.id}`}
                            onClick={() => setOpen(false)}
                            onKeyDown={(event) => moveResultFocus(event, index, visibleResults.length, inputRef.current)}
                            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 outline-none hover:bg-[#f3f6f9] focus-visible:bg-[#f3f6f9] focus-visible:ring-3 focus-visible:ring-lime/40"
                          >
                            <MediaImage
                              src={product.image}
                              alt=""
                              fit="contain"
                              sizes="64px"
                              className="size-16 shrink-0 rounded-xl bg-white"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] font-semibold tracking-[0.14em] text-[#7FA82E] uppercase">
                                {product.category}
                              </span>
                              <span className="mt-0.5 block truncate font-heading text-base font-semibold text-primary">
                                {product.name}
                              </span>
                              <span className="mt-0.5 block text-sm text-muted-foreground">
                                {formatINR(amount)}
                                {trade ? " trade" : " MRP"}
                                {product.sku ? ` · ${product.sku}` : ""}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })
                  : null}
              </ul>
              {visibleStatus === "ready" && visibleTotal > visibleResults.length ? (
                <Link
                  href={`/products?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setOpen(false)}
                  className="mx-3 mt-2 block rounded-2xl px-3 py-3 text-center text-sm font-semibold text-primary hover:bg-[#f3f6f9]"
                >
                  See all {visibleTotal} products
                </Link>
              ) : null}
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </SearchContext.Provider>
  );
}

export function CatalogueSearchField({
  label,
  className,
  inputClassName,
  iconClassName,
  buttonClassName,
}: {
  label: string;
  className?: string;
  inputClassName: string;
  iconClassName: string;
  buttonClassName: string;
}) {
  const { openSearch } = useCatalogueSearch();
  const [value, setValue] = useState("");

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    openSearch(value);
  };

  return (
    <form role="search" className={className} onSubmit={submit}>
      <Search className={iconClassName} />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          openSearch(value);
        }}
        aria-label={label}
        placeholder="Search name, finish, size…"
        autoComplete="off"
        enterKeyHint="search"
        className={inputClassName}
      />
      <button type="submit" aria-label={label} className={buttonClassName}>
        Search
      </button>
    </form>
  );
}

export function HeroSearch() {
  return (
    <CatalogueSearchField
      label="Search fittings"
      className="relative mt-6 max-w-md"
      iconClassName="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/70"
      inputClassName="h-12 w-full rounded-full border border-white/15 bg-white/12 pr-24 pl-11 text-base text-white outline-none backdrop-blur-md placeholder:text-white/60 focus:border-lime focus:ring-3 focus:ring-lime/35"
      buttonClassName="absolute top-1/2 right-1.5 h-9 -translate-y-1/2 rounded-full bg-lime px-3 text-sm font-semibold text-primary"
    />
  );
}

function moveResultFocus(
  event: KeyboardEvent<HTMLAnchorElement>,
  index: number,
  count: number,
  input: HTMLInputElement | null,
) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  if (event.key === "ArrowUp") {
    if (index === 0) input?.focus();
    else document.getElementById(`search-result-${index - 1}`)?.focus();
    return;
  }
  if (index < count - 1) document.getElementById(`search-result-${index + 1}`)?.focus();
}
