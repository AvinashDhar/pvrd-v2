function imageHosts() {
  const patterns = [{ protocol: "https", hostname: "*.r2.dev", pathname: "/**" }];
  const raw = process.env.R2_PUBLIC_URL?.trim();
  if (!raw) return patterns;
  try {
    const url = new URL(raw);
    if (url.protocol === "https:") {
      patterns.push({ protocol: "https", hostname: url.hostname, pathname: "/**" });
    }
  } catch {
    // An invalid public URL is ignored here and rejected when an upload runs.
  }
  return patterns;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "pdfkit", "sharp"],
  // pdfkit opens Helvetica with a runtime require of js/standard-fonts/*.cjs.
  // The deploy trace does not follow that, so Hostinger never receives the file.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pdfkit/js/standard-fonts/**/*"],
  },
  // Category/product/banner uploads allow 2 MB in storeImage. Next rejects the
  // Server Action body at 1 MB by default (before the action runs), which shows
  // up as a bare 500 when replacing a category image with a typical photo.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageHosts(),
  },
};

export default nextConfig;
