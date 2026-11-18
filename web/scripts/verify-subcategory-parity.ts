import { isNotNull, isNull } from "drizzle-orm";
import { loadEnvLocal } from "../lib/db/load-env";

loadEnvLocal();

async function main() {
  const { getCategory, listSubcategories, getProduct, listCategories } = await import("../lib/catalogue/queries");
  const { publicCategories, pageCatalogue, getPublicProduct } = await import("../lib/catalogue");
  const { db } = await import("../lib/db");
  const { products } = await import("../lib/db/schema");

  const cases: { name: string; pass: boolean; detail?: string }[] = [];

  const cats = await listCategories();
  const withSubs = cats.filter((c) => c.subcategories.length > 0);
  cases.push({
    name: "listCategories_includes_sub_fields",
    pass: withSubs.every((c) => c.subcategories.every((s) => Array.isArray(s.fields) && s.fields.length > 0)),
    detail: `${withSubs.length} cats`,
  });

  const category = withSubs[0];
  const detail = await getCategory(category.id);
  cases.push({
    name: "getCategory_subcategories_have_image_and_fields",
    pass: Boolean(detail && detail.subcategories.every((s) => "imageUrl" in s && s.fields.length > 0)),
  });

  const publicCats = await publicCategories();
  const pub = publicCats.find((c) => c.subcategories.length > 0)!;
  cases.push({
    name: "publicCategories_sub_images",
    pass: pub.subcategories.every((s) => Boolean(s.image)),
  });

  const allPage = await pageCatalogue({ category: pub.slug, limit: 50, offset: 0 });
  const sub = pub.subcategories.find((s) => s.products > 0) || pub.subcategories[0];
  const subPage = await pageCatalogue({ category: pub.slug, subcategory: sub.slug, limit: 50, offset: 0 });
  cases.push({
    name: "pageCatalogue_subcategory_subset",
    pass: subPage.total <= allPage.total,
    detail: `all=${allPage.total} sub=${subPage.total}`,
  });

  const linked = await db.select({ id: products.id }).from(products).where(isNotNull(products.subcategoryId)).limit(5);
  for (const row of linked) {
    const product = await getProduct(row.id);
    const publicProduct = await getPublicProduct(row.id);
    cases.push({
      name: `linked_product_${row.id.slice(0, 8)}`,
      pass: Boolean(product && product.subcategoryId && publicProduct),
      detail: product ? `${product.name} / ${product.subcategoryName}` : "missing",
    });
  }

  const [unassigned] = await db
    .select({ id: products.id, categoryId: products.categoryId })
    .from(products)
    .where(isNull(products.subcategoryId))
    .limit(1);
  if (unassigned) {
    const product = await getProduct(unassigned.id);
    const cat = await getCategory(unassigned.categoryId);
    cases.push({
      name: "unassigned_product_uses_category_fields",
      pass: Boolean(product && !product.subcategoryId && cat?.fields.length),
      detail: product?.name,
    });
  } else {
    cases.push({
      name: "unassigned_product_uses_category_fields",
      pass: true,
      detail: "no unassigned in DB currently; skipped",
    });
  }

  const nested = await listSubcategories();
  const mismatched = nested.filter((s) => !s.fields.length).map((s) => s.name);
  cases.push({
    name: "existing_subcats_have_fields_after_backfill",
    pass: mismatched.length === 0,
    detail: mismatched.join(",") || "ok",
  });

  console.log(JSON.stringify(cases, null, 2));
  if (cases.some((c) => !c.pass)) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
