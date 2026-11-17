import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Repo-root local-assets/catalogues — gitignored import sources. */
export function localCataloguesRoot() {
  return resolve(process.cwd(), "..", "local-assets", "catalogues");
}

export function localCatalogueData(...parts: string[]) {
  return resolve(localCataloguesRoot(), "data", ...parts);
}

export function localCataloguePublic(...parts: string[]) {
  return resolve(localCataloguesRoot(), "public", ...parts);
}

/** Resolve import JSON, preferring local-assets then web/data. */
export function resolveCatalogueDataFile(name: string) {
  const local = localCatalogueData(name);
  if (existsSync(local)) return local;
  return resolve(process.cwd(), "data", name);
}

/**
 * Resolve a public URL like /catalogue/p04-00.jpg or /marketing/25.jpg
 * from local-assets first, then web/public.
 */
export function resolvePublicImportPath(url: string) {
  if (!url.startsWith("/") || url.includes("..")) return null;
  const relative = decodeURIComponent(url.slice(1));
  const local = localCataloguePublic(relative);
  if (existsSync(local)) return local;
  const fallback = resolve(process.cwd(), "public", relative);
  if (existsSync(fallback)) return fallback;
  return null;
}
