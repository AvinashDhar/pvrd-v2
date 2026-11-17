import { BUILTIN_SCHEMA_VERSION, type CategoryField, type DisplayRate, type FieldType } from "@/lib/categories/field-schemas";

export const fieldTypes: FieldType[] = ["text", "number", "select", "textarea", "image", "checkbox"];

export const lockedFieldKeys = new Set(["name", "mrp"]);

export const starterFields: CategoryField[] = [
  { key: "image", label: "Upload Photo", type: "image", required: true },
  { key: "brand", label: "Brand", type: "select", required: true },
  { key: "name", label: "Product Name", type: "text", required: true },
  { key: "sku", label: "SKU / Product Code", type: "text", required: false },
  { key: "mrp", label: "MRP", type: "number", required: true },
  { key: "price", label: "Trade price", type: "number", required: true },
  { key: "contractorDiscount", label: "Contractor Discount", type: "number", required: true },
  { key: "consumerDiscount", label: "Consumer Discount", type: "number", required: true },
  { key: "points", label: "Points", type: "number", required: false },
  { key: "description", label: "Description", type: "textarea", required: false },
];

const lockedFields: CategoryField[] = [
  { key: "name", label: "Product Name", type: "text", required: true },
  { key: "mrp", label: "MRP", type: "number", required: true },
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

export function readSchemaVersion(value: unknown) {
  if (value && typeof value === "object" && "schemaVersion" in value) {
    const version = Number((value as { schemaVersion?: unknown }).schemaVersion);
    return Number.isFinite(version) ? version : 0;
  }
  return 0;
}

export function readDisplayRates(value: unknown): DisplayRate[] {
  if (value && typeof value === "object" && Array.isArray((value as { displayRates?: unknown }).displayRates)) {
    return ((value as { displayRates: unknown[] }).displayRates).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const rate = item as Partial<DisplayRate>;
      const formula = String(rate.formula ?? "").trim();
      if (!formula) return [];
      const keys = Array.isArray(rate.keys) ? rate.keys.map((key) => String(key)) : [];
      return [{ label: String(rate.label ?? "Display rate").trim() || "Display rate", formula, keys }];
    });
  }
  const formula = readFormula(value);
  return formula ? [{ label: "Display rate", formula, keys: [] }] : [];
}

export function computeDisplayRate(keys: string[], attributes: Record<string, string>) {
  if (keys.length === 0) return null;
  let product = 1;
  for (const key of keys) {
    const raw = attributes[key];
    if (!raw?.trim()) return null;
    const number = Number(raw);
    if (!Number.isFinite(number)) return null;
    product *= number;
  }
  return Number.isInteger(product) ? String(product) : String(Math.round(product * 100) / 100);
}

export { BUILTIN_SCHEMA_VERSION };

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
    const options = Array.isArray(raw.options)
      ? raw.options.map((option) => String(option).trim()).filter(Boolean)
      : [];
    const group = String(raw.group ?? "").trim();
    fields.push({
      key,
      label,
      type,
      required: Boolean(raw.required),
      ...(options.length > 0 ? { options } : {}),
      ...(raw.copyFromParent ? { copyFromParent: true } : {}),
      ...(group ? { group } : {}),
    });
  }

  if (lockCore) {
    for (const field of lockedFields) {
      if (!seen.has(field.key)) fields.unshift(field);
    }
  }
  return fields;
}

export function fieldChangeError(previous: CategoryField[], next: CategoryField[], stored: Record<string, string[]>) {
  const nextByKey = new Map(next.map((field) => [field.key, field]));
  for (const field of previous) {
    const values = (stored[field.key] ?? []).map((value) => value.trim()).filter(Boolean);
    if (values.length === 0) continue;
    const updated = nextByKey.get(field.key);
    const label = updated?.label || field.label;
    if (!updated) return `${label} already has saved values on products in this category, so it cannot be removed.`;
    if (updated.type !== field.type && (field.type === "image" || updated.type === "image" || values.some((value) => !valueFits(updated.type, value)))) {
      return `${label} already has saved values, so it cannot change from ${field.type} to ${updated.type}.`;
    }
  }
  return null;
}

function valueFits(type: FieldType, value: string) {
  if (type === "number") return Number.isFinite(Number(value));
  if (type === "checkbox") return value === "yes";
  if (type === "image") return false;
  return true;
}
