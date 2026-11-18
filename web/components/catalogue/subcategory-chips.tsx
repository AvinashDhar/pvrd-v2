"use client";

import Link from "next/link";
import { beginAppNavigation } from "@/components/brand/navigation-signal";
import { cn } from "@/lib/utils";

type Chip = {
  slug: string;
  name: string;
  products: number;
  href: string;
};

export function SubcategoryChips({
  categoryProducts,
  allHref,
  subcategories,
  activeSlug = "",
}: {
  categoryProducts: number;
  allHref: string;
  subcategories: Chip[];
  activeSlug?: string;
}) {
  if (subcategories.length === 0) return null;

  return (
    <div className="mt-3 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none" }}>
      <div className="flex w-max gap-2 pb-0.5">
        <ChipLink
          label="All"
          count={categoryProducts}
          selected={!activeSlug}
          href={allHref}
        />
        {subcategories.map((item) => (
          <ChipLink
            key={item.slug}
            label={item.name}
            count={item.products}
            selected={item.slug === activeSlug}
            href={item.href}
          />
        ))}
      </div>
    </div>
  );
}

function ChipLink({
  label,
  count,
  selected,
  href,
}: {
  label: string;
  count: number;
  selected: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => beginAppNavigation(href)}
      scroll={false}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
        selected
          ? "border-[#001F3D] bg-[#001F3D] text-white"
          : "border-[#dfe5ea] bg-white text-[#222] hover:border-[#b8c4ce] hover:bg-[#f6f8fa]",
      )}
    >
      <span>{label}</span>
      <span className={cn("text-xs", selected ? "text-white/70" : "text-[#8a9199]")}>{count}</span>
    </Link>
  );
}
