import type { NextConfig } from "next";

function imageHosts(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
  ];
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

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageHosts(),
  },
};

export default nextConfig;
