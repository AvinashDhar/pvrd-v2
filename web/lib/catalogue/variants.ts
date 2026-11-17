export type CatalogueVariant = {
  id?: string;
  name: string;
  finish: string | null;
  size: string | null;
  price: string | null;
  image: string | null;
  mrp: string;
  points: string;
  packing: string | null;
  unit: string | null;
};

export type VariantGroupBy = "finish" | "size" | "none";

export type VariantGroup = {
  label: string;
  items: CatalogueVariant[];
};

function clean(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function unique(values: (string | null)[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

/** Pick the shorter choice as the chip row so the list underneath stays a single fact. */
export function groupVariants(variants: CatalogueVariant[]) {
  const finishes = unique(variants.map((variant) => clean(variant.finish)));
  const sizes = unique(variants.map((variant) => clean(variant.size)));
  const groupBy: VariantGroupBy =
    finishes.length > 1 && finishes.length <= Math.max(sizes.length, 1) ? "finish" : sizes.length > 1 && finishes.length > 1 ? "size" : "none";

  if (groupBy === "none") {
    return { groupBy, groups: [{ label: "Options", items: variants }] satisfies VariantGroup[] };
  }

  const labels = groupBy === "finish" ? finishes : sizes;
  return {
    groupBy,
    groups: labels.map((label) => ({
      label,
      items: variants.filter((variant) => clean(variant[groupBy]) === label),
    })),
  };
}

export function variantRowLabel(variant: CatalogueVariant, groupBy: VariantGroupBy) {
  if (groupBy === "finish") return clean(variant.size) ?? variant.name;
  if (groupBy === "size") return clean(variant.finish) ?? variant.name;
  return clean(variant.size) ?? clean(variant.finish) ?? variant.name;
}

export function variantRowDetail(variant: CatalogueVariant, groupBy: VariantGroupBy) {
  const parts: string[] = [];
  if (groupBy === "none") {
    const size = clean(variant.size);
    const finish = clean(variant.finish);
    if (size && finish) parts.push(finish);
  }
  const packing = clean(variant.packing);
  if (packing) parts.push(packing);
  const points = Number(variant.points);
  if (Number.isFinite(points) && points > 0) parts.push(`${points} pts`);
  return parts.join(" · ");
}
