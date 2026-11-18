export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Per-file cap for every image upload (products, categories, banners, logos, photos). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Ceiling for all new product/variant images in one create/update request.
 * Next.js `serverActions.bodySizeLimit` must stay at least this high.
 */
export const MAX_PRODUCT_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Headroom for text fields around a single-image multipart request. */
export const MAX_SINGLE_UPLOAD_REQUEST_BYTES = MAX_IMAGE_BYTES + 256 * 1024;

export function megabytesLabel(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return Number.isInteger(mb) ? `${mb} MB` : `${Math.round(mb * 10) / 10} MB`;
}

export function imageUploadHint(maxBytes = MAX_IMAGE_BYTES) {
  return `JPG, PNG, or WEBP, up to ${megabytesLabel(maxBytes)}`;
}

export function imageTypeError(file: File) {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Upload a JPG, PNG, or WEBP image.";
  }
  return null;
}

export function imageSizeError(file: File, maxBytes = MAX_IMAGE_BYTES) {
  if (file.size <= 0) return "Choose an image file to upload.";
  if (file.size > maxBytes) {
    return `Each image must be ${megabytesLabel(maxBytes)} or smaller. Compress the file and try again.`;
  }
  return null;
}

export function validateImageFile(file: File, maxBytes = MAX_IMAGE_BYTES) {
  return imageTypeError(file) ?? imageSizeError(file, maxBytes);
}

export function validateProductUploads(files: File[]) {
  let total = 0;
  for (const file of files) {
    const invalid = validateImageFile(file);
    if (invalid) return invalid;
    total += file.size;
  }
  if (total > MAX_PRODUCT_UPLOAD_BYTES) {
    return `All new product images together must be ${megabytesLabel(MAX_PRODUCT_UPLOAD_BYTES)} or smaller. Remove or compress some files, then try again.`;
  }
  return null;
}

export function collectProductUploadFiles(formData: FormData) {
  const files: File[] = [];
  for (const value of formData.getAll("images")) {
    if (value instanceof File && value.size > 0) files.push(value);
  }
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("variantImage_")) continue;
    if (value instanceof File && value.size > 0) files.push(value);
  }
  return files;
}

export function contentLengthError(request: Request, maxBytes: number) {
  const raw = request.headers.get("content-length");
  if (!raw) return null;
  const length = Number(raw);
  if (!Number.isFinite(length) || length < 0) return null;
  if (length <= maxBytes) return null;
  return `This upload is too large. Keep the request under ${megabytesLabel(maxBytes)}.`;
}

export function isUploadSizeMessage(message: string) {
  return /too large|or smaller|together must be/i.test(message);
}
