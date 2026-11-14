import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const PDF_KEY = /^catalogues\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

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

function remoteUploadsBlocked() {
  return process.env.PVRD_FORBID_R2 === "1";
}

export function cataloguePdfKey(categoryId: string) {
  const key = `catalogues/${categoryId}.pdf`;
  if (!PDF_KEY.test(key)) throw new Error("Category id is invalid.");
  return key;
}

function localPath(key: string) {
  if (!PDF_KEY.test(key)) throw new Error("Storage path is invalid.");
  const root = path.resolve(process.cwd(), "storage");
  const full = path.resolve(root, key);
  if (!full.startsWith(`${root}${path.sep}`)) throw new Error("Storage path is invalid.");
  return full;
}

export async function storePdf(categoryId: string, body: Buffer) {
  const key = cataloguePdfKey(categoryId);
  const r2 = remoteUploadsBlocked() ? null : r2Config();
  if (r2) {
    await r2Client(r2).send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: body,
        ContentType: "application/pdf",
      }),
    );
    await rm(localPath(key), { force: true });
    return { url: `${r2.publicUrl}/${key}`, key };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("File storage is not configured. Set the R2 environment variables.");
  }

  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return { url: `/storage/${key}`, key };
}

export async function readStoredPdf(key: string | null | undefined) {
  if (!key || !PDF_KEY.test(key)) return null;
  const r2 = remoteUploadsBlocked() ? null : r2Config();
  if (r2) {
    try {
      const result = await r2Client(r2).send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }));
      const bytes = await result.Body?.transformToByteArray();
      if (bytes) return Buffer.from(bytes);
    } catch {
      // A file written before R2 was configured can still live on disk.
    }
  }
  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function removeStoredPdf(key: string | null | undefined) {
  if (!key || !PDF_KEY.test(key)) return;
  await rm(localPath(key), { force: true });
  if (remoteUploadsBlocked()) return;
  const r2 = r2Config();
  if (!r2) return;
  await r2Client(r2).send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }));
}
