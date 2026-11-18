import { asc, count, eq } from "drizzle-orm";
import { loadEnvLocal } from "../lib/db/load-env";

loadEnvLocal();

async function main() {
  const { db } = await import("../lib/db");
  const { categories, newId, products, subcategories } = await import("../lib/db/schema");

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      fieldSchema: categories.fieldSchema,
      variantSchema: categories.variantSchema,
      total: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  const target = [...rows].sort((a, b) => Number(b.total) - Number(a.total)).find((row) => Number(row.total) > 0);
  if (!target) throw new Error("No category with products");
  console.log(
    "product_counts",
    rows
      .map((row) => ({ name: row.name, slug: row.slug, total: Number(row.total) }))
      .filter((row) => row.total > 0),
  );

  const existing = await db.select().from(subcategories).where(eq(subcategories.categoryId, target.id));
  const wanted = [
    { name: "Popular picks", slug: "popular-picks", sortOrder: 0 },
    { name: "New arrivals", slug: "new-arrivals", sortOrder: 1 },
  ];

  const created: { id: string; slug: string }[] = [];
  for (const item of wanted) {
    const hit = existing.find((row) => row.slug === item.slug);
    if (hit) {
      created.push({ id: hit.id, slug: hit.slug });
      continue;
    }
    const id = newId();
    await db.insert(subcategories).values({
      id,
      categoryId: target.id,
      name: item.name,
      slug: item.slug,
      status: "active",
      sortOrder: item.sortOrder,
      description: null,
      fieldSchema: target.fieldSchema,
      variantSchema: target.variantSchema,
    });
    created.push({ id, slug: item.slug });
  }

  const productRows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.categoryId, target.id))
    .orderBy(asc(products.name))
    .limit(12);

  let index = 0;
  for (const product of productRows) {
    const sub = created[index % created.length];
    await db.update(products).set({ subcategoryId: sub.id }).where(eq(products.id, product.id));
    index += 1;
  }

  const assignment = await db
    .select({ subcategoryId: products.subcategoryId, total: count() })
    .from(products)
    .where(eq(products.categoryId, target.id))
    .groupBy(products.subcategoryId);

  console.log(
    JSON.stringify(
      {
        category: {
          id: target.id,
          slug: target.slug,
          name: target.name,
          total: Number(target.total),
        },
        subcategories: created,
        assignment: assignment.map((row) => ({
          subcategoryId: row.subcategoryId,
          total: Number(row.total),
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
