import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { LEGACY_REDIRECTS } from "./lib/legacy-redirects";
import { SITE_PHASE } from "./lib/site";

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

  // "cleanup" phase only: keep every page OUT of the search index (crawl-but-noindex) while
  // Google re-crawls to see the 301s/410s and de-indexes the old hacked spam. The crawl
  // itself stays allowed (robots.ts), so the cleanup works. Removed automatically at launch
  // (SITE_PHASE = "live"). Uses X-Robots-Tag (HTTP header) so it can't be overridden per-page.
  async headers() {
    if (SITE_PHASE !== "cleanup") return [];
    return [
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] },
    ];
  },
};

export default nextConfig;

// Makes Cloudflare bindings available during `next dev` (OpenNext).
initOpenNextCloudflareForDev();
