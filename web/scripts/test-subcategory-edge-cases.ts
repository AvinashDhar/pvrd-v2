/**
 * Edge cases + payload/body limits for category + multi-subcategory saves.
 * Usage: npx tsx scripts/test-subcategory-edge-cases.ts
 */
import { loadEnvLocal } from "../lib/db/load-env";

loadEnvLocal();

type Case = { name: string; pass: boolean; detail?: string };
const cases: Case[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  cases.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function tinyPng(name = "x.png", type = "image/png") {
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  return new File([bytes], name, { type });
}

function bigFakeImage(bytes: number, name = "big.png", type = "image/png") {
  return new File([new Uint8Array(bytes)], name, { type });
}

function validDraft(fd: FormData, key: string, overrides: Record<string, string | File> = {}) {
  const prefix = `sub.${key}`;
  const defaults: Record<string, string | File> = {
    [`${prefix}.name`]: `Edge ${key}`,
    [`${prefix}.status`]: "active",
    [`${prefix}.sortOrder`]: "0",
    [`${prefix}.description`]: "",
    [`${prefix}.fields`]: "[]",
    [`${prefix}.variantFields`]: "[]",
    [`${prefix}.image`]: tinyPng(`${key}.png`),
  };
  for (const [k, v] of Object.entries({ ...defaults, ...overrides })) fd.set(k, v);
}

async function main() {
  const {
    findDuplicateDraftName,
    readSubcategoryDrafts,
    validateSubcategoryDraft,
  } = await import("../lib/catalogue/subcategory-drafts");
  const {
    MAX_IMAGE_BYTES,
    MAX_PRODUCT_UPLOAD_BYTES,
    collectCategorySaveUploadFiles,
    megabytesLabel,
    validateCategorySaveUploads,
    validateImageFile,
  } = await import("../lib/storage/upload-limits");
  const nextConfig = (await import("../next.config.mjs")).default as {
    experimental?: { serverActions?: { bodySizeLimit?: string } };
  };

  console.log("\n=== Payload / body limits ===");
  const bodyLimit = nextConfig.experimental?.serverActions?.bodySizeLimit;
  assert("serverActions_bodySizeLimit_50mb", bodyLimit === "50mb", String(bodyLimit));
  assert("per_image_cap_5mb", MAX_IMAGE_BYTES === 5 * 1024 * 1024, megabytesLabel(MAX_IMAGE_BYTES));
  assert(
    "combined_upload_cap_matches_body_limit",
    MAX_PRODUCT_UPLOAD_BYTES === 50 * 1024 * 1024,
    megabytesLabel(MAX_PRODUCT_UPLOAD_BYTES),
  );
  assert(
    "ten_max_images_fit_under_combined_cap",
    10 * MAX_IMAGE_BYTES <= MAX_PRODUCT_UPLOAD_BYTES,
    `${10 * MAX_IMAGE_BYTES} <= ${MAX_PRODUCT_UPLOAD_BYTES}`,
  );
  assert(
    "eleven_max_images_exceed_combined_cap",
    11 * MAX_IMAGE_BYTES > MAX_PRODUCT_UPLOAD_BYTES,
    `${11 * MAX_IMAGE_BYTES} > ${MAX_PRODUCT_UPLOAD_BYTES}`,
  );

  console.log("\n=== Draft parsing edge cases ===");
  {
    const fd = new FormData();
    fd.set("subDraftKeys", "{not-json");
    assert("malformed_subDraftKeys_yields_empty", readSubcategoryDrafts(fd).length === 0);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["a", "a", "  ", "b"]));
    validDraft(fd, "a");
    validDraft(fd, "b");
    const drafts = readSubcategoryDrafts(fd);
    assert("duplicate_keys_deduped", drafts.map((d) => d.key).join(",") === "a,b", drafts.map((d) => d.key).join(","));
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", "[]");
    assert("empty_draft_list_ok", readSubcategoryDrafts(fd).length === 0);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["z"]));
    validDraft(fd, "z", { "sub.z.fields": "{bad", "sub.z.variantFields": "nope" });
    const draft = readSubcategoryDrafts(fd)[0];
    assert("bad_fields_json_becomes_empty_array", Array.isArray(draft.fields) && draft.fields.length === 0);
    assert("bad_variant_json_becomes_empty_array", Array.isArray(draft.variantFields) && draft.variantFields.length === 0);
  }

  console.log("\n=== Field validation edge cases ===");
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.name": "   " });
    assert("whitespace_name_rejected", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".name") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.name": "x".repeat(161) });
    assert("name_over_160_rejected", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".name") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.name": "x".repeat(160) });
    assert("name_exactly_160_ok", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]) === null);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.description": "d".repeat(2001) });
    assert(
      "description_over_2000_rejected",
      validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".description") === true,
    );
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.description": "d".repeat(2000) });
    assert("description_exactly_2000_ok", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]) === null);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.sortOrder": "1.5" });
    assert("sort_fraction_rejected", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".sortOrder") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.sortOrder": "-1" });
    assert("sort_negative_rejected", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".sortOrder") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.sortOrder": "10001" });
    assert("sort_over_10000_rejected", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".sortOrder") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.sortOrder": "10000" });
    assert("sort_exactly_10000_ok", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]) === null);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.sortOrder": "abc" });
    assert("sort_nan_rejected", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".sortOrder") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.sortOrder": "" });
    assert("sort_empty_rejected", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".sortOrder") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.status": "inactive" });
    assert("status_inactive_rejected_for_sub", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".status") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.status": " hidden " });
    // trim on status should accept hidden
    assert("status_trimmed_hidden_ok", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]) === null);
  }

  console.log("\n=== Image type / size edge cases ===");
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.image": new File([new Uint8Array(0)], "empty.png", { type: "image/png" }) });
    assert("empty_file_treated_as_missing", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0])?.field.endsWith(".image") === true);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.image": tinyPng("x.gif", "image/gif") });
    const err = validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]);
    assert("gif_rejected", err?.field.endsWith(".image") === true, err?.error);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.image": bigFakeImage(MAX_IMAGE_BYTES + 1) });
    const err = validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]);
    assert("over_5mb_image_rejected", err?.field.endsWith(".image") === true, err?.error);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["n"]));
    validDraft(fd, "n", { "sub.n.image": bigFakeImage(MAX_IMAGE_BYTES, "exact.png", "image/png") });
    assert("exactly_5mb_png_ok", validateSubcategoryDraft(readSubcategoryDrafts(fd)[0]) === null);
  }
  {
    assert("validateImageFile_jpeg_ok", validateImageFile(tinyPng("a.jpg", "image/jpeg")) === null);
    assert("validateImageFile_webp_ok", validateImageFile(tinyPng("a.webp", "image/webp")) === null);
  }

  console.log("\n=== Duplicate names ===");
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["a", "b"]));
    validDraft(fd, "a", { "sub.a.name": "Rails" });
    validDraft(fd, "b", { "sub.b.name": "rails" });
    const dup = findDuplicateDraftName(readSubcategoryDrafts(fd));
    assert("case_insensitive_dup_in_batch", Boolean(dup?.field.endsWith(".name")), dup?.error);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["a"]));
    validDraft(fd, "a", { "sub.a.name": "Existing One" });
    const dup = findDuplicateDraftName(readSubcategoryDrafts(fd), ["existing one"]);
    assert("dup_against_existing_subcategory", Boolean(dup?.field.endsWith(".name")), dup?.error);
  }
  {
    const fd = new FormData();
    fd.set("subDraftKeys", JSON.stringify(["a", "b"]));
    validDraft(fd, "a", { "sub.a.name": "Rails" });
    validDraft(fd, "b", { "sub.b.name": "Shelves" });
    assert("unique_batch_names_ok", findDuplicateDraftName(readSubcategoryDrafts(fd), ["Hinges"]) === null);
  }

  console.log("\n=== Combined category+sub upload payload ===");
  {
    const fd = new FormData();
    fd.set("image", tinyPng("cat.png"));
    fd.set("subDraftKeys", JSON.stringify(["a", "b"]));
    validDraft(fd, "a");
    validDraft(fd, "b");
    const files = collectCategorySaveUploadFiles(fd);
    assert("collects_category_and_sub_images", files.length === 3, String(files.length));
    assert("small_bundle_ok", validateCategorySaveUploads(files) === null);
  }
  {
    const fd = new FormData();
    // 11 x ~5MB would exceed 50MB; use exact math with MAX_IMAGE_BYTES files
    const keys = Array.from({ length: 11 }, (_, i) => `k${i}`);
    fd.set("subDraftKeys", JSON.stringify(keys));
    for (const key of keys) {
      validDraft(fd, key, { [`sub.${key}.image`]: bigFakeImage(MAX_IMAGE_BYTES, `${key}.png`) });
    }
    const files = collectCategorySaveUploadFiles(fd);
    const err = validateCategorySaveUploads(files);
    assert(
      "eleven_5mb_subs_exceed_50mb_cap",
      Boolean(err && /category and subcategory images together must be/i.test(err)),
      err ?? undefined,
    );
  }
  {
    const fd = new FormData();
    fd.set("image", bigFakeImage(MAX_IMAGE_BYTES, "cat.png"));
    const keys = Array.from({ length: 9 }, (_, i) => `k${i}`);
    fd.set("subDraftKeys", JSON.stringify(keys));
    for (const key of keys) {
      validDraft(fd, key, { [`sub.${key}.image`]: bigFakeImage(MAX_IMAGE_BYTES, `${key}.png`) });
    }
    // category + 9 subs = 10 * 5MB = 50MB exactly → should pass
    const err = validateCategorySaveUploads(collectCategorySaveUploadFiles(fd));
    assert("exactly_50mb_bundle_ok", err === null, err ?? undefined);
  }
  {
    const fd = new FormData();
    fd.set("image", bigFakeImage(MAX_IMAGE_BYTES, "cat.png"));
    const keys = Array.from({ length: 10 }, (_, i) => `k${i}`);
    fd.set("subDraftKeys", JSON.stringify(keys));
    for (const key of keys) {
      validDraft(fd, key, { [`sub.${key}.image`]: bigFakeImage(MAX_IMAGE_BYTES, `${key}.png`) });
    }
    // category + 10 subs = 55MB → fail before Next body reject
    const err = validateCategorySaveUploads(collectCategorySaveUploadFiles(fd));
    assert(
      "category_plus_ten_5mb_subs_rejected",
      Boolean(err && /category and subcategory images together must be/i.test(err)),
      err ?? undefined,
    );
  }

  const failed = cases.filter((c) => !c.pass);
  console.log(`\n=== Result: ${cases.length - failed.length}/${cases.length} passed ===`);
  if (failed.length) {
    for (const f of failed) console.error(` - ${f.name}: ${f.detail ?? ""}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
