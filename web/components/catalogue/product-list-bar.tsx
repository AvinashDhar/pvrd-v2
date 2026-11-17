"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Check, SlidersHorizontal } from "lucide-react";
import { beginAppNavigation } from "@/components/brand/navigation-signal";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const sorts = [
  { id: "relevance", label: "Relevance" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "name", label: "Name" },
] as const;

export function ProductListBar({
  categories,
  query = "",
  category = "",
  sort = "relevance",
}: {
  categories: { slug: string; name: string; products: number }[];
  query?: string;
  category?: string;
  sort?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"sort" | "filter" | null>(null);
  const activeSort = sorts.some((item) => item.id === sort) ? sort : "relevance";
  const filters = category ? 1 : 0;

  function visit(next: { category?: string; sort?: string }) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const nextCategory = next.category === undefined ? category : next.category;
    const nextSort = next.sort === undefined ? activeSort : next.sort;
    if (nextCategory) params.set("category", nextCategory);
    if (nextSort && nextSort !== "relevance") params.set("sort", nextSort);
    const search = params.toString();
    const href = search ? `/products?${search}` : "/products";
    beginAppNavigation(href);
    router.push(href);
    setOpen(null);
  }

  return (
    <>
      <div className="flex border-y border-[#ececec] bg-white sm:rounded-xl sm:border">
        <button
          type="button"
          onClick={() => setOpen("sort")}
          className="flex h-12 flex-1 items-center justify-center gap-2 text-sm font-semibold text-[#222] transition-colors hover:bg-[#f6f8fa] active:bg-[#e8eef3]"
        >
          <ArrowUpDown className="size-4" />
          Sort
        </button>
        <div className="w-px self-stretch bg-[#ececec]" />
        <button
          type="button"
          onClick={() => setOpen("filter")}
          className="relative flex h-12 flex-1 items-center justify-center gap-2 text-sm font-semibold text-[#222] transition-colors hover:bg-[#f6f8fa] active:bg-[#e8eef3]"
        >
          <span className="relative">
            <SlidersHorizontal className="size-4" />
            {filters > 0 ? (
              <span className="absolute -top-2 -right-2 grid size-4 place-items-center rounded-full bg-[#e11d2e] text-[10px] font-bold text-white">
                {filters}
              </span>
            ) : null}
          </span>
          Filter
        </button>
      </div>

      {open === "sort" ? (
      <Sheet open onOpenChange={(value) => { if (!value) setOpen(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-6">
          <SheetHeader>
            <SheetTitle>Sort</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1 px-4">
            {sorts.map((item) => {
              const selected = item.id === activeSort;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => visit({ sort: item.id })}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-secondary",
                    selected ? "bg-secondary text-primary" : "text-[#222]",
                  )}
                >
                  {item.label}
                  {selected ? <Check className="size-4" /> : null}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      ) : null}

      {open === "filter" ? (
      <Sheet open onOpenChange={(value) => { if (!value) setOpen(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Category</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1 overflow-y-auto px-4 pb-6">
            <button
              type="button"
              onClick={() => visit({ category: "" })}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-secondary",
                category ? "text-[#222]" : "bg-secondary text-primary",
              )}
            >
              All products
              {category ? null : <Check className="size-4" />}
            </button>
            {categories.map((item) => {
              const selected = item.slug === category;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => visit({ category: item.slug })}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-secondary",
                    selected ? "bg-secondary text-primary" : "text-[#222]",
                  )}
                >
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-[#8a9199]">
                    {item.products}
                    {selected ? <Check className="size-4 text-primary" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      ) : null}
    </>
  );
}
