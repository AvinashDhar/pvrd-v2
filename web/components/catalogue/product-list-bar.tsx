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

type CategoryOption = {
  slug: string;
  name: string;
  products: number;
  subcategories: { slug: string; name: string; products: number }[];
};

function productsHref(input: {
  query?: string;
  category?: string;
  subcategory?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();
  if (input.query) params.set("q", input.query);
  if (input.category) params.set("category", input.category);
  if (input.category && input.subcategory) params.set("subcategory", input.subcategory);
  if (input.sort && input.sort !== "relevance") params.set("sort", input.sort);
  const search = params.toString();
  return search ? `/products?${search}` : "/products";
}

export function ProductListBar({
  categories,
  query = "",
  category = "",
  subcategory = "",
  sort = "relevance",
}: {
  categories: CategoryOption[];
  query?: string;
  category?: string;
  subcategory?: string;
  sort?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"sort" | "filter" | null>(null);
  const activeSort = sorts.some((item) => item.id === sort) ? sort : "relevance";
  const filters = (category ? 1 : 0) + (subcategory ? 1 : 0);
  const activeCategory = categories.find((item) => item.slug === category);

  function visit(next: { category?: string; subcategory?: string; sort?: string }) {
    const nextCategory = next.category === undefined ? category : next.category;
    const nextSubcategory =
      next.subcategory === undefined
        ? next.category !== undefined && next.category !== category
          ? ""
          : subcategory
        : next.subcategory;
    const nextSort = next.sort === undefined ? activeSort : next.sort;
    const href = productsHref({
      query,
      category: nextCategory,
      subcategory: nextSubcategory,
      sort: nextSort,
    });
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
              onClick={() => visit({ category: "", subcategory: "" })}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-secondary",
                category ? "text-[#222]" : "bg-secondary text-primary",
              )}
            >
              All products
              {category ? null : <Check className="size-4" />}
            </button>
            {categories.map((item) => {
              const selected = item.slug === category && !subcategory;
              return (
                <div key={item.slug} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => visit({ category: item.slug, subcategory: "" })}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-secondary",
                      selected ? "bg-secondary text-primary" : "text-[#222]",
                    )}
                  >
                    <span className="min-w-0 truncate">{item.name}</span>
                    <span className="flex shrink-0 items-center gap-2 text-[#8a9199]">
                      {item.products}
                      {selected ? <Check className="size-4 text-primary" /> : null}
                    </span>
                  </button>
                  {item.slug === category && item.subcategories.length > 0 ? (
                    <div className="ml-3 space-y-1 border-l border-[#ececec] pl-3">
                      {item.subcategories.map((child) => {
                        const childSelected = child.slug === subcategory;
                        return (
                          <button
                            key={child.slug}
                            type="button"
                            onClick={() => visit({ category: item.slug, subcategory: child.slug })}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted active:bg-secondary",
                              childSelected ? "bg-secondary font-medium text-primary" : "text-[#444]",
                            )}
                          >
                            <span className="min-w-0 truncate">{child.name}</span>
                            <span className="flex shrink-0 items-center gap-2 text-[#8a9199]">
                              {child.products}
                              {childSelected ? <Check className="size-4 text-primary" /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      ) : null}
    </>
  );
}
