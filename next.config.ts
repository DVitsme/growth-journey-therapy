import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { LEGACY_REDIRECTS } from "./lib/legacy-redirects";

const nextConfig: NextConfig = {
  images: {
    // All imagery is local (public/ + content-imported), so no remotePatterns are needed.
    // Cloudflare's IMAGES binding (wrangler.jsonc) backs next/image optimization in production.
    formats: ["image/avif", "image/webp"],
  },

  // --- SEO redirect layer (post-WordPress recovery) ---
  // NOTE: `proxy.ts`/middleware is NOT usable here — OpenNext/Cloudflare rejects Node
  // middleware and Next 16 proxies are always Node runtime. So the legacy 301s live in
  // redirects() and the spam 410s are handled via rewrites() -> app/api/gone (which can
  // emit 410). redirects() run BEFORE rewrites(), so a legit legacy dated URL 301s before
  // the generic dated-spam rule can 410 it. Data: docs/seo/, generated lib/legacy-redirects.ts.
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({
      source: r.source,
      destination: r.destination,
      statusCode: 301 as const, // literal 301 (permanent:true would emit 308)
    }));
  },

  async rewrites() {
    // Hacked-site spam lives in closed namespaces with no legitimate routes on the new
    // site (verified). Rewrite the whole shapes to the 410 handler.
    return [
      { source: "/:y(\\d{4})/:m(\\d{2})/:d(\\d{2})/:rest*", destination: "/api/gone" },
      { source: "/category/:rest*", destination: "/api/gone" },
      { source: "/author/:rest*", destination: "/api/gone" },
    ];
  },
};

export default nextConfig;

// Makes Cloudflare bindings available during `next dev` (OpenNext).
initOpenNextCloudflareForDev();
