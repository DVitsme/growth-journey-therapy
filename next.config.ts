import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // All imagery is local (public/ + content-imported), so no remotePatterns are needed.
    // Cloudflare's IMAGES binding (wrangler.jsonc) backs next/image optimization in production.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

// Makes Cloudflare bindings available during `next dev` (OpenNext).
initOpenNextCloudflareForDev();
