import { validateImageFile } from "@/lib/storage/upload-limits";

export type SubcategoryDraftInput = {
  key: string;
  name: string;
  description: string;
  status: string;
  sortOrder: number;
  fields: unknown;
  variantFields: unknown;
  image: File | null;
};

export function readSubcategoryDrafts(formData: FormData): SubcategoryDraftInput[] {
  let keys: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("subDraftKeys") ?? "[]"));
    if (Array.isArray(parsed)) {
      keys = [...new Set(parsed.map((key) => String(key).trim()).filter(Boolean))];
    }
  } catch {
    keys = [];
  }

  return keys.map((key) => {
    const prefix = `sub.${key}`;
    const image = formData.get(`${prefix}.image`);
    const sortRaw = String(formData.get(`${prefix}.sortOrder`) ?? "0").trim();
    return {
      key,
      name: String(formData.get(`${prefix}.name`) ?? "").trim(),
      description: String(formData.get(`${prefix}.description`) ?? "").trim(),
      status: String(formData.get(`${prefix}.status`) ?? "active").trim(),
      sortOrder: sortRaw === "" ? Number.NaN : Number(sortRaw),
      fields: (() => {
        try {
          return JSON.parse(String(formData.get(`${prefix}.fields`) ?? "[]"));
        } catch {
          return [];
        }
      })(),
      variantFields: (() => {
        try {
          return JSON.parse(String(formData.get(`${prefix}.variantFields`) ?? "[]"));
        } catch {
          return [];
        }
      })(),
      image: image instanceof File && image.size > 0 ? image : null,
    };
  });
}

export function validateSubcategoryDraft(draft: SubcategoryDraftInput): { error: string; field: string } | null {
  const prefix = `sub.${draft.key}`;
  if (!draft.name) return { error: "Subcategory name is required.", field: `${prefix}.name` };
  if (draft.name.length > 160) return { error: "Name must be 160 characters or fewer.", field: `${prefix}.name` };
  if (draft.description.length > 2000) {
    return { error: "Description must be 2000 characters or fewer.", field: `${prefix}.description` };
  }
  if (!["active", "hidden"].includes(draft.status)) {
    return { error: "Choose a valid status.", field: `${prefix}.status` };
  }
  if (!Number.isInteger(draft.sortOrder) || draft.sortOrder < 0 || draft.sortOrder > 10_000) {
    return { error: "Sort order must be a whole number from 0 to 10000.", field: `${prefix}.sortOrder` };
  }
  if (!draft.image) return { error: "A subcategory image is required.", field: `${prefix}.image` };
  const imageError = validateImageFile(draft.image);
  if (imageError) return { error: imageError, field: `${prefix}.image` };
  return null;
}

export function findDuplicateDraftName(
  drafts: SubcategoryDraftInput[],
  existingNames: string[] = [],
): { error: string; field: string } | null {
  const seen = new Set(existingNames.map((name) => name.trim().toLowerCase()).filter(Boolean));
  for (const draft of drafts) {
    const key = draft.name.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      return {
        error: existingNames.length
          ? "A subcategory with this name already exists in this category."
          : "Subcategory names must be unique in this save.",
        field: `sub.${draft.key}.name`,
      };
    }
    seen.add(key);
  }
  return null;
}
