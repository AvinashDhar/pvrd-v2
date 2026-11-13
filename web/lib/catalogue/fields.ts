import type { CategoryField, FieldType } from "@/lib/categories/field-schemas";

export const fieldTypes: FieldType[] = ["text", "number", "select", "textarea", "image", "checkbox"];

export const lockedFieldKeys = new Set(["name", "mrp", "price"]);

export const starterFields: CategoryField[] = [
  { key: "image", label: "Upload Photo", type: "image", required: true },
  { key: "brand", label: "Brand", type: "select", required: true },
  { key: "name", label: "Product Name", type: "text", required: true },
  { key: "sku", label: "SKU / Product Code", type: "text", required: false },
  { key: "mrp", label: "MRP", type: "number", required: true },
  { key: "price", label: "Price", type: "number", required: true },
  { key: "contractorDiscount", label: "Contractor Discount", type: "number", required: true },
  { key: "consumerDiscount", label: "Consumer Discount", type: "number", required: true },
  { key: "points", label: "Points", type: "number", required: false },
  { key: "description", label: "Description", type: "textarea", required: false },
];

const lockedFields: CategoryField[] = [
  { key: "name", label: "Product Name", type: "text", required: true },
  { key: "mrp", label: "MRP", type: "number", required: true },
  { key: "price", label: "Price", type: "number", required: true },
];

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

export function readFields(value: unknown): CategoryField[] {
  if (Array.isArray(value)) return value as CategoryField[];
  if (value && typeof value === "object" && Array.isArray((value as { fields?: unknown }).fields)) {
    return (value as { fields: CategoryField[] }).fields;
  }
  return [];
}

export function readFormula(value: unknown) {
  if (value && typeof value === "object" && "displayFormula" in value) {
    const formula = (value as { displayFormula?: unknown }).displayFormula;
    return typeof formula === "string" ? formula : undefined;
  }
  return undefined;
}

export function readVariantFields(value: unknown): CategoryField[] {
  return Array.isArray(value) ? (value as CategoryField[]) : [];
}

export function normalizeFields(input: unknown, lockCore = true) {
  if (!Array.isArray(input)) return lockedFields;
  const fields: CategoryField[] = [];
  const seen = new Set<string>();

  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Partial<CategoryField>;
    const label = String(raw.label ?? "").trim();
    const type = fieldTypes.includes(raw.type as FieldType) ? (raw.type as FieldType) : "text";
    const key = String(raw.key ?? "").trim() || slugify(label).replace(/-/g, "");
    if (!label || !key || seen.has(key)) continue;
    seen.add(key);
    fields.push({ key, label, type, required: Boolean(raw.required) });
  }

  if (lockCore) {
    for (const field of lockedFields) {
      if (!seen.has(field.key)) fields.unshift(field);
    }
  }
  return fields;
}
