import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_IMAGE_BYTES, validateImageFile } from "@/lib/storage/upload-limits";

const REMOTE_UPLOADS_PER_MINUTE = 12;
const recentRemoteUploads: number[] = [];

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export { MAX_IMAGE_BYTES, MAX_PRODUCT_UPLOAD_BYTES, imageUploadHint } from "@/lib/storage/upload-limits";

export type ImageLocation =
  | { folder: "products"; id: string }
  | { folder: "variants"; productId: string; id: string }
  | { folder: "categories"; id: string }
  | { folder: "brands"; id: string }
  | { folder: "banners"; id: string }
  | { folder: "users"; id: string }
  | { folder: "notifications"; id: string }
  | { folder: "company" };

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function r2Client(config: NonNullable<ReturnType<typeof r2Config>>) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function safeId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Image folder id is invalid.");
  }
  return id;
}

function objectKey(location: ImageLocation, fileId: string, extension: string) {
  const file = `${fileId}.${extension}`;
  switch (location.folder) {
    case "products":
      return `products/${safeId(location.id)}/${file}`;
    case "variants":
      return `products/${safeId(location.productId)}/variants/${safeId(location.id)}/${file}`;
    case "categories":
      return `categories/${safeId(location.id)}/${file}`;
    case "brands":
      return `brands/${safeId(location.id)}/${file}`;
    case "banners":
      return `banners/${safeId(location.id)}/${file}`;
    case "users":
      return `users/${safeId(location.id)}/${file}`;
    case "notifications":
      return `notifications/${safeId(location.id)}/${file}`;
    case "company":
      return `company/logo/${file}`;
  }
}

function remoteUploadsBlocked() {
  return process.env.PVRD_FORBID_R2 === "1";
}

function reserveRemoteUpload() {
  const now = Date.now();
  while (recentRemoteUploads.length > 0 && now - recentRemoteUploads[0] > 60_000) {
    recentRemoteUploads.shift();
  }
  if (recentRemoteUploads.length >= REMOTE_UPLOADS_PER_MINUTE) {
    throw new Error(
      "Paused image uploads. Twelve files were already stored in the last minute, which covers normal editing and keeps the Cloudflare R2 monthly allowance intact. Catalogue photos stay on this server.",
    );
  }
  recentRemoteUploads.push(now);
}

export async function storeImage(file: File, location: ImageLocation) {
  const invalid = validateImageFile(file, MAX_IMAGE_BYTES);
  if (invalid) throw new Error(invalid);

  const extension = extensions[file.type];
  if (!extension) {
    throw new Error("Upload a JPG, PNG, or WEBP image.");
  }

  const id = randomUUID();
  const key = objectKey(location, id, extension);
  const body = Buffer.from(await file.arrayBuffer());
  const r2 = remoteUploadsBlocked() ? null : r2Config();
  if (r2) {
    reserveRemoteUpload();
    await r2Client(r2).send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
      }),
    );
    return { id, url: `${r2.publicUrl}/${key}`, key };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Image storage is not configured. Set the R2 environment variables.");
  }

  const directory = path.join(process.cwd(), "public", path.dirname(key));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", key), body);
  return { id, url: `/${key}`, key };
}

export async function removeStoredImage(url?: string | null, objectKey?: string | null) {
  if (remoteUploadsBlocked()) return;
  const r2 = r2Config();
  if (!r2) return;
  const key = objectKey?.trim() || keyFromPublicUrl(r2.publicUrl, url);
  if (!key || key.includes("..") || key.startsWith("/")) return;
  await r2Client(r2).send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }));
}

function keyFromPublicUrl(publicUrl: string, url?: string | null) {
  if (!url || !url.startsWith(`${publicUrl}/`)) return null;
  return decodeURIComponent(url.slice(publicUrl.length + 1));
}
