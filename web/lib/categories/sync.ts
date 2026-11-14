import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { BUILTIN_SCHEMA_VERSION, builtinFieldSchema, categorySchemas } from "@/lib/categories/field-schemas";
import { readSchemaVersion } from "@/lib/catalogue/fields";

let pending: Promise<void> | null = null;

export function ensureBuiltinSchemas() {
  if (!pending) {
    pending = syncBuiltinCategorySchemas().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

export async function syncBuiltinCategorySchemas() {
  const rows = await db.select({ slug: categories.slug, fieldSchema: categories.fieldSchema }).from(categories);
  const stored = new Map(rows.map((row) => [row.slug, row.fieldSchema]));

  for (const schema of categorySchemas) {
    if (!stored.has(schema.slug)) continue;
    if (readSchemaVersion(stored.get(schema.slug)) >= BUILTIN_SCHEMA_VERSION) continue;
    await db
      .update(categories)
      .set({
        fieldSchema: builtinFieldSchema(schema),
        variantSchema: schema.variantFields,
      })
      .where(eq(categories.slug, schema.slug));
  }
}
