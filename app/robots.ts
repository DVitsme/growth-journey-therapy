import type { MetadataRoute } from "next";
import { SITE_PHASE, SITE_URL } from "@/lib/site";

/**
 * robots.txt for growthjourneytherapy.com — phase-gated by SITE_PHASE (see lib/site.ts).
 *
 * AI-crawler policy (Variant A, "allow AI"): AI *search / citation* bots (OAI-SearchBot,
 * Claude-SearchBot, PerplexityBot, Google/AI Overviews via Googlebot) stay allowed so the
 * practice shows up in AI answers. We only name the one scraper that abuses robots.txt.
 * robots.txt is advisory — the real enforcement is Cloudflare's edge AI-bot blocking, and
 * Bytespider ignores robots.txt anyway, so this is belt-and-suspenders.
 */
const BLOCKED_BOTS = ["Bytespider"];

export default function robots(): MetadataRoute.Robots {
  // Pre-launch (default): hide everything, advertise nothing.
  if (SITE_PHASE === "blocked") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  // cleanup + live both ALLOW crawling, so Google can reach the legacy /YYYY/MM/DD/*,
  // /category/*, /author/* URLs and see the 301s/410s that de-index the old hack. Do NOT
  // disallow those shapes. `/api/` is the only internal path to keep out. In "cleanup", a
  // site-wide `X-Robots-Tag: noindex` (next.config.ts) keeps the real pages out of results;
  // only "live" advertises the sitemap.
  const rules = [
    { userAgent: "*", allow: "/", disallow: "/api/" },
    ...BLOCKED_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
  ];

  return SITE_PHASE === "live"
    ? { rules, sitemap: `${SITE_URL}/sitemap.xml` }
    : { rules };
}
