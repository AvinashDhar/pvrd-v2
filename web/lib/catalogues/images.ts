import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_BYTES = 8 * 1024 * 1024;

export async function rasterizeImage(url: string | null | undefined, width: number) {
  if (!url) return null;
  try {
    const bytes = await readImage(url);
    if (!bytes) return null;
    const jpeg = await sharp(bytes, { failOn: "none" })
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 74 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

async function readImage(url: string) {
  if (url.startsWith("/")) return readPublicFile(url);
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) return null;
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return bytes.byteLength > MAX_BYTES ? null : bytes;
}

async function readPublicFile(url: string) {
  const pathname = decodeURIComponent(url.split("?")[0] ?? "");
  if (!pathname.startsWith("/") || pathname.includes("\0")) return null;
  const root = path.resolve(process.cwd(), "public");
  const full = path.resolve(root, `.${pathname}`);
  if (!full.startsWith(`${root}${path.sep}`)) return null;
  try {
    const bytes = await readFile(full);
    return bytes.byteLength > MAX_BYTES ? null : bytes;
  } catch {
    return null;
  }
}

export async function mapLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index]);
    }
  }
  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, () => run()));
  return results;
}
