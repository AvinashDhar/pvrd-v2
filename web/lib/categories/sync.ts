import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { BUILTIN_SCHEMA_VERSION, builtinFieldSchema, categorySchemas } from "@/lib/categories/field-schemas";
import { isSeedDisplayRateDescription, readSchemaVersion, stripDisplayRateSchema } from "@/lib/catalogue/fields";

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
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      description: categories.description,
      fieldSchema: categories.fieldSchema,
    })
    .from(categories);
  const builtins = new Map(categorySchemas.map((schema) => [schema.slug, schema]));

  for (const row of rows) {
    const builtin = builtins.get(row.slug);
    const needsBuiltinRefresh = Boolean(builtin && readSchemaVersion(row.fieldSchema) < BUILTIN_SCHEMA_VERSION);
    const stripped = stripDisplayRateSchema(row.fieldSchema);
    const clearDescription = isSeedDisplayRateDescription(row.description);

    if (!needsBuiltinRefresh && !stripped.changed && !clearDescription) continue;

    await db
      .update(categories)
      .set({
        ...(needsBuiltinRefresh && builtin
          ? {
              fieldSchema: builtinFieldSchema(builtin),
              variantSchema: builtin.variantFields,
            }
          : stripped.changed
            ? { fieldSchema: stripped.schema }
            : {}),
        ...(clearDescription ? { description: null } : {}),
      })
      .where(eq(categories.id, row.id));
  }
}
