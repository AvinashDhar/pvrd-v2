"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import { moneyAmount } from "@/lib/pricing";
import { groupVariants, variantRowDetail, variantRowLabel, type CatalogueVariant } from "@/lib/catalogue/variants";
import { cn } from "@/lib/utils";

export function ProductVariants({
  variants,
  trade,
  productPrice,
}: {
  variants: CatalogueVariant[];
  trade: boolean;
  productPrice: number;
}) {
  const { groupBy, groups } = groupVariants(variants);
  const [selected, setSelected] = useState(groups[0]?.label ?? "");
  const active = groups.find((group) => group.label === selected) ?? groups[0];
  if (!active || variants.length === 0) return null;

  const heading = groupBy === "finish" ? "Sizes" : groupBy === "size" ? "Finishes" : "Options";

  return (
    <section className="mt-6" aria-labelledby="product-options">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="product-options" className="font-heading text-base font-semibold text-primary">
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground">{variants.length} options</p>
      </div>

      {groupBy !== "none" ? (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={groupBy === "finish" ? "Finish" : "Size"}>
          {groups.map((group) => {
            const pressed = group.label === active.label;
            return (
              <button
                key={group.label}
                type="button"
                aria-pressed={pressed}
                onClick={() => setSelected(group.label)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  pressed ? "bg-primary text-white" : "bg-muted text-primary hover:bg-secondary",
                )}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {active.items.map((variant) => {
          const mrp = moneyAmount(variant.mrp);
          const tradePrice = trade ? (moneyAmount(variant.price) ?? productPrice) : null;
          const different = tradePrice != null && mrp != null && tradePrice !== mrp;
          const amount = different ? tradePrice : (mrp ?? tradePrice);
          const detail = variantRowDetail(variant, groupBy);
          return (
            <li
              key={`${variant.name}-${variant.size}-${variant.finish}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-muted/70 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-base font-semibold text-primary">{variantRowLabel(variant, groupBy)}</p>
                {detail ? <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p> : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-heading text-base font-semibold whitespace-nowrap">{amount == null ? "—" : formatINR(amount)}</p>
                <p className="text-xs whitespace-nowrap text-muted-foreground">
                  {different && mrp != null ? `Trade · MRP ${formatINR(mrp)}` : trade ? "Trade price" : "MRP"}
                  {variant.unit ? ` / ${variant.unit}` : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
