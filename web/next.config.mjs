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
  // Global Server Action ceiling. App code enforces tighter rules:
  // - 5 MB per image everywhere (categories, banners, brands, logos, photos)
  // - 50 MB total for product create/update (many product + variant images)
  // Next rejects oversized bodies before the action runs, so this must stay
  // high enough for product posts. Single-image actions still return a clear
  // form/API error when a file exceeds 5 MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageHosts(),
  },
};

export default nextConfig;
