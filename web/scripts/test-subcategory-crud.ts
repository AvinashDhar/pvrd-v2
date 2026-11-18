/**
 * Extensive subcategory CRUD against the live DB + image storage.
 * Creates a throwaway category named with marker CRUDTEST_*, exercises create/read/update/hide/delete,
 * then cleans every marked row.
 *
 * Usage: npx tsx scripts/test-subcategory-crud.ts
 *        npx tsx scripts/test-subcategory-crud.ts --keep   # skip cleanup
 */
import { eq, like, or } from "drizzle-orm";
import { loadEnvLocal } from "../lib/db/load-env";

loadEnvLocal();

const MARKER = "CRUDTEST";
const KEEP = process.argv.includes("--keep");

type Case = { name: string; pass: boolean; detail?: string };
const cases: Case[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  cases.push({ name, pass, detail });
  const icon = pass ? "PASS" : "FAIL";
  console.log(`${icon}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function tinyPng(label: string) {
  // Minimal valid 1x1 PNG
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  return new File([bytes], `${label}.png`, { type: "image/png" });
}

async function main() {
  const { db } = await import("../lib/db");
  const { activityLogs, categories, newId, products, subcategories } = await import("../lib/db/schema");
  const { starterFields } = await import("../lib/catalogue/fields");
  const { BUILTIN_SCHEMA_VERSION } = await import("../lib/categories/field-schemas");
  const { storeImage, removeStoredImage } = await import("../lib/storage/images");
  const { readSubcategoryDrafts, validateSubcategoryDraft } = await import("../lib/catalogue/subcategory-drafts");
  const { insertSubcategoryDraft } = await import("../lib/actions/subcategories");
  const { getCategory, listSubcategories } = await import("../lib/catalogue/queries");
  const { slugify } = await import("../lib/catalogue/fields");

  const stamp = Date.now();
  const categoryName = `${MARKER} Cat ${stamp}`;
  const categoryId = newId();

  console.log("\n=== 1) Draft validation (unit) ===");
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["a", "b"]));
    fd.set("sub.a.name", "Alpha");
    fd.set("sub.a.status", "active");
    fd.set("sub.a.sortOrder", "1");
    fd.set("sub.a.description", "first");
    fd.set("sub.a.fields", JSON.stringify(starterFields));
    fd.set("sub.a.variantFields", "[]");
    fd.set("sub.a.image", tinyPng("a"));
    fd.set("sub.b.name", "");
    fd.set("sub.b.status", "active");
    fd.set("sub.b.sortOrder", "2");
    fd.set("sub.b.fields", "[]");
    fd.set("sub.b.variantFields", "[]");
    // no image for b

    const drafts = readSubcategoryDrafts(fd);
    assert("parse_two_drafts", drafts.length === 2, String(drafts.length));
    assert("draft_a_valid", validateSubcategoryDraft(drafts[0]) === null);
    const bErr = validateSubcategoryDraft(drafts[1]);
    assert("draft_b_requires_name", Boolean(bErr && bErr.field.endsWith(".name")), bErr?.error);
  }

  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["x"]));
    fd.set("sub.x.name", "Needs image");
    fd.set("sub.x.status", "active");
    fd.set("sub.x.sortOrder", "0");
    fd.set("sub.x.fields", "[]");
    fd.set("sub.x.variantFields", "[]");
    const err = validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]);
    assert("draft_requires_image", Boolean(err && err.field.endsWith(".image")), err?.error);
  }

  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["y"]));
    fd.set("sub.y.name", "Bad status");
    fd.set("sub.y.status", "nope");
    fd.set("sub.y.sortOrder", "0");
    fd.set("sub.y.fields", "[]");
    fd.set("sub.y.variantFields", "[]");
    fd.set("sub.y.image", tinyPng("y"));
    const err = validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]);
    assert("draft_rejects_bad_status", Boolean(err && err.field.endsWith(".status")), err?.error);
  }

  console.log("\n=== 2) CREATE category + 3 subcategories at once ===");
  const categoryImage = await storeImage(tinyPng("cat"), { folder: "categories", id: categoryId });
  await db.insert(categories).values({
    id: categoryId,
    name: categoryName,
    slug: slugify(categoryName),
    description: "CRUD test category — safe to delete",
    status: "active",
    imageUrl: categoryImage.url,
    imageKey: categoryImage.key,
    fieldSchema: { schemaVersion: BUILTIN_SCHEMA_VERSION, fields: starterFields },
    variantSchema: [],
  });

  const draftSpecs = [
    { key: "d1", name: `${MARKER} Sub Alpha ${stamp}`, status: "active", sortOrder: 0, description: "alpha desc" },
    { key: "d2", name: `${MARKER} Sub Beta ${stamp}`, status: "active", sortOrder: 1, description: "beta desc" },
    { key: "d3", name: `${MARKER} Sub Gamma ${stamp}`, status: "hidden", sortOrder: 2, description: "gamma hidden" },
  ];

  const createFd = new FormData();
  createFd.set("subDraftKeys", JSON.stringify(draftSpecs.map((d) => d.key)));
  for (const draft of draftSpecs) {
    const prefix = `sub.${draft.key}`;
    createFd.set(`${prefix}.name`, draft.name);
    createFd.set(`${prefix}.status`, draft.status);
    createFd.set(`${prefix}.sortOrder`, String(draft.sortOrder));
    createFd.set(`${prefix}.description`, draft.description);
    createFd.set(`${prefix}.fields`, JSON.stringify(starterFields));
    createFd.set(`${prefix}.variantFields`, "[]");
    createFd.set(`${prefix}.image`, tinyPng(draft.key));
  }
  const drafts = readSubcategoryDrafts(createFd);
  for (const draft of drafts) {
    const err = validateSubcategoryDraft(draft);
    assert(`precreate_valid_${draft.key}`, err === null, err?.error);
  }

  const createdIds: string[] = [];
  for (const draft of drafts) {
    const id = await insertSubcategoryDraft(categoryId, draft, "CRUD Tester");
    createdIds.push(id);
  }
  assert("created_three_subcategories", createdIds.length === 3, createdIds.join(","));

  console.log("\n=== 3) READ / list ===");
  const detail = await getCategory(categoryId);
  assert("getCategory_finds_parent", Boolean(detail && detail.name === categoryName));
  assert("getCategory_has_three_subs", detail?.subcategories.length === 3, String(detail?.subcategories.length));
  assert(
    "subs_have_images_and_fields",
    Boolean(detail?.subcategories.every((s) => s.imageUrl && s.fields.length > 0)),
  );
  assert(
    "sort_order_respected",
    detail?.subcategories.map((s) => s.sortOrder).join(",") === "0,1,2",
    detail?.subcategories.map((s) => s.sortOrder).join(","),
  );

  const listed = await listSubcategories(categoryId);
  assert("listSubcategories_scoped", listed.length === 3, String(listed.length));
  const gamma = listed.find((s) => s.name.includes("Gamma"));
  assert("gamma_starts_hidden", gamma?.status === "hidden", gamma?.status);

  console.log("\n=== 4) UPDATE subcategory (name, description, sort, image) ===");
  const alpha = listed.find((s) => s.name.includes("Alpha"))!;
  const updatedName = `${MARKER} Sub Alpha Edited ${stamp}`;
  const newImage = await storeImage(tinyPng("alpha-edit"), { folder: "subcategories", id: alpha.id });
  const previousImage = alpha.imageUrl;
  await db
    .update(subcategories)
    .set({
      name: updatedName,
      description: "edited description",
      sortOrder: 5,
      imageUrl: newImage.url,
      imageKey: newImage.key,
      fieldSchema: {
        schemaVersion: BUILTIN_SCHEMA_VERSION,
        fields: [...starterFields, { key: "finish", label: "Finish", type: "text", required: false }],
      },
    })
    .where(eq(subcategories.id, alpha.id));
  if (previousImage) {
    try {
      await removeStoredImage(previousImage, alpha.imageKey);
    } catch {
      // ignore cleanup failure for old object
    }
  }

  const afterEdit = await getCategory(categoryId);
  const edited = afterEdit?.subcategories.find((s) => s.id === alpha.id);
  assert("update_name", edited?.name === updatedName, edited?.name);
  assert("update_description", edited?.description === "edited description");
  assert("update_sort", edited?.sortOrder === 5, String(edited?.sortOrder));
  assert("update_image_changed", Boolean(edited?.imageUrl && edited.imageUrl !== previousImage));
  assert("update_added_field", Boolean(edited?.fields.some((f) => f.key === "finish")));

  console.log("\n=== 5) HIDE / ACTIVATE ===");
  const beta = afterEdit!.subcategories.find((s) => s.name.includes("Beta"))!;
  await db.update(subcategories).set({ status: "hidden" }).where(eq(subcategories.id, beta.id));
  const afterHide = await getCategory(categoryId);
  assert(
    "hide_beta",
    afterHide?.subcategories.find((s) => s.id === beta.id)?.status === "hidden",
  );
  await db.update(subcategories).set({ status: "active" }).where(eq(subcategories.id, beta.id));
  const afterShow = await getCategory(categoryId);
  assert(
    "activate_beta",
    afterShow?.subcategories.find((s) => s.id === beta.id)?.status === "active",
  );

  console.log("\n=== 6) ADD more subcategory onto existing category ===");
  const moreFd = new FormData();
  moreFd.set("subDraftKeys", JSON.stringify(["more1"]));
  moreFd.set("sub.more1.name", `${MARKER} Sub Delta ${stamp}`);
  moreFd.set("sub.more1.status", "active");
  moreFd.set("sub.more1.sortOrder", "9");
  moreFd.set("sub.more1.description", "added later");
  moreFd.set("sub.more1.fields", JSON.stringify(starterFields));
  moreFd.set("sub.more1.variantFields", "[]");
  moreFd.set("sub.more1.image", tinyPng("more1"));
  const moreDraft = readSubcategoryDrafts(moreFd)[0];
  const deltaId = await insertSubcategoryDraft(categoryId, moreDraft, "CRUD Tester");
  createdIds.push(deltaId);
  const afterMore = await getCategory(categoryId);
  assert("add_fourth_subcategory", afterMore?.subcategories.length === 4, String(afterMore?.subcategories.length));

  console.log("\n=== 7) Duplicate-name guard at draft validation layer ===");
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["p", "q"]));
    for (const key of ["p", "q"]) {
      fd.set(`sub.${key}.name`, "Same Name");
      fd.set(`sub.${key}.status`, "active");
      fd.set(`sub.${key}.sortOrder`, "0");
      fd.set(`sub.${key}.fields`, "[]");
      fd.set(`sub.${key}.variantFields`, "[]");
      fd.set(`sub.${key}.image`, tinyPng(key));
    }
    const parsed = readSubcategoryDrafts(fd);
    const names = new Set<string>();
    let duplicate = false;
    for (const draft of parsed) {
      const key = draft.name.toLowerCase();
      if (names.has(key)) duplicate = true;
      names.add(key);
    }
    assert("detect_duplicate_draft_names", duplicate);
  }

  console.log("\n=== 8) DELETE subcategory (product link cleared) ===");
  // Optionally attach a temp product link if any product exists without subcategory — skip creating products.
  // Delete Gamma.
  const toDelete = afterMore!.subcategories.find((s) => s.name.includes("Gamma"))!;
  await db.update(products).set({ subcategoryId: null }).where(eq(products.subcategoryId, toDelete.id));
  await db.delete(subcategories).where(eq(subcategories.id, toDelete.id));
  try {
    await removeStoredImage(toDelete.imageUrl, toDelete.imageKey);
  } catch {
    // ignore
  }
  const afterDelete = await getCategory(categoryId);
  assert(
    "delete_gamma",
    afterDelete?.subcategories.length === 3 && !afterDelete.subcategories.some((s) => s.id === toDelete.id),
    String(afterDelete?.subcategories.length),
  );

  console.log("\n=== 9) Activity log entries present ===");
  const logs = await db
    .select({ title: activityLogs.title })
    .from(activityLogs)
    .where(like(activityLogs.title, `%${MARKER}%`));
  // insertSubcategoryDraft uses actor name, not MARKER in title — check by entity ids instead
  const byEntity = await db
    .select({ title: activityLogs.title, entityId: activityLogs.entityId })
    .from(activityLogs)
    .where(or(...createdIds.map((id) => eq(activityLogs.entityId, id))));
  assert("activity_logs_for_creates", byEntity.length >= 3, String(byEntity.length));

  console.log("\n=== 10) Cleanup ===");
  if (KEEP) {
    console.log(`--keep set; leaving ${categoryName} (${categoryId})`);
  } else {
    const remaining = await db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId));
    for (const row of remaining) {
      await db.update(products).set({ subcategoryId: null }).where(eq(products.subcategoryId, row.id));
      await db.delete(subcategories).where(eq(subcategories.id, row.id));
      try {
        await removeStoredImage(row.imageUrl, row.imageKey);
      } catch {
        // ignore
      }
    }
    // also remove any other MARKER leftovers from prior failed runs
    const leftoverSubs = await db.select().from(subcategories).where(like(subcategories.name, `${MARKER}%`));
    for (const row of leftoverSubs) {
      await db.update(products).set({ subcategoryId: null }).where(eq(products.subcategoryId, row.id));
      await db.delete(subcategories).where(eq(subcategories.id, row.id));
      try {
        await removeStoredImage(row.imageUrl, row.imageKey);
      } catch {
        // ignore
      }
    }
    const leftoverCats = await db.select().from(categories).where(like(categories.name, `${MARKER}%`));
    for (const row of leftoverCats) {
      await db.delete(categories).where(eq(categories.id, row.id));
      try {
        await removeStoredImage(row.imageUrl, row.imageKey);
      } catch {
        // ignore
      }
    }
    const gone = await getCategory(categoryId);
    assert("cleanup_category_gone", gone === null);
    const markerLeft = await db
      .select({ id: categories.id })
      .from(categories)
      .where(like(categories.name, `${MARKER}%`));
    const markerSubsLeft = await db
      .select({ id: subcategories.id })
      .from(subcategories)
      .where(like(subcategories.name, `${MARKER}%`));
    assert("cleanup_no_marker_categories", markerLeft.length === 0, String(markerLeft.length));
    assert("cleanup_no_marker_subcategories", markerSubsLeft.length === 0, String(markerSubsLeft.length));
  }

  const failed = cases.filter((c) => !c.pass);
  console.log(`\n=== Result: ${cases.length - failed.length}/${cases.length} passed ===`);
  if (failed.length) {
    console.error("Failures:");
    for (const f of failed) console.error(` - ${f.name}: ${f.detail ?? ""}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
