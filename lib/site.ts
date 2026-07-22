/**
 * Site-wide constants. The public base URL lives here (single source of truth).
 *
 * NEXT_PUBLIC_SITE_URL is inlined at build time — changing the domain is a rebuild + redeploy.
 * Falls back to the production domain until the env var is set. Drives metadataBase, sitemap,
 * robots, canonical tags, and share links so they all move together.
 */

const FALLBACK = "https://growthjourneytherapy.com";

function normalize(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return FALLBACK;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const SITE_URL = normalize(process.env.NEXT_PUBLIC_SITE_URL);

/**
 * Launch phase (inlined at build, like SITE_URL). Drives robots.txt + the cleanup-mode
 * noindex header. Any unset/unknown value → "blocked" (safe default: nothing indexed).
 *   blocked → hidden from search engines (robots `Disallow: /`).
 *   cleanup → crawlable but real pages carry `X-Robots-Tag: noindex` — lets Google see the
 *             spam 410s/301s and de-index the old hack, while keeping the new pages out of
 *             results. Sitemap is NOT advertised in this phase.
 *   live    → fully public + indexed; sitemap advertised.
 * To change: set NEXT_PUBLIC_SITE_PHASE in .env.local, then rebuild + redeploy.
 */
export type SitePhase = "blocked" | "cleanup" | "live";
export const SITE_PHASE: SitePhase =
  process.env.NEXT_PUBLIC_SITE_PHASE === "live"
    ? "live"
    : process.env.NEXT_PUBLIC_SITE_PHASE === "cleanup"
      ? "cleanup"
      : "blocked";

export const SITE = {
  name: "Growth Journey Therapy",
  tagline: "Reclaim Your Happiness",
  description:
    "Bilingual, culturally-affirming therapy for individuals, families, and couples in Philadelphia and across Pennsylvania via telehealth. You are welcome here.",
  phone: "(267) 713-8831",
  phoneHref: "tel:+12677138831",
  email: "growthjourney.therapy@gmail.com",
  address: {
    street: "2201 Pennsylvania Ave, Suite 101",
    city: "Philadelphia",
    state: "PA",
    zip: "19130",
  },
  serviceArea: "Philadelphia, PA (in person) · All of Pennsylvania via telehealth",
  locales: ["en", "es"] as const,
  defaultLocale: "en" as const,
} as const;

export type Locale = (typeof SITE.locales)[number];
