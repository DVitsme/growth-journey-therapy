import fs from "node:fs";
import path from "node:path";
import type { Block } from "@/components/site/block-renderer";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export type Feature = { title: string; desc: string };
export type LinkBtn = { text: string; href: string };

export type MethodDoc = {
  slug: string;
  type: "method" | "specialty" | "bespoke";
  /** Primary content language; pages wrap Spanish docs in lang="es" for assistive tech. */
  lang?: "en" | "es";
  title: string;
  /** Display title for the hero when it differs from the meta/card/breadcrumb title
   *  (e.g. Culturally Informed Therapy's hero reads "Culturally Sensitive Therapy"). */
  heroTitle?: string;
  subheads: string[];
  heroImage: string;
  heroImageAlt: string;
  heroButton?: LinkBtn | null;
  intro?: { heading: string; body: string } | null;
  features: Feature[];
  cta?: { heading: string; body: string; button?: LinkBtn | null } | null;
  /** Prose fallback for pages whose Divi layout doesn't fit the feature-grid template. */
  bodyMarkdown?: string;
  /** Ordered blocks for the faithful section-by-section renderer (specialties). */
  blocks?: Block[];
  excerpt: string;
  seoDescription: string;
};

function readType(type: "method" | "specialty" | "bespoke"): MethodDoc[] {
  const dir = path.join(PAGES_DIR, type);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ ...(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as MethodDoc), type }));
}

export function getMethod(slug: string, type: "method" | "specialty" | "bespoke"): MethodDoc | undefined {
  return readType(type).find((d) => d.slug === slug);
}

export function getMethodSlugs(type: "method" | "specialty" | "bespoke"): string[] {
  return readType(type).map((d) => d.slug);
}

export function getMethodCards(type: "method" | "specialty" | "bespoke"): MethodDoc[] {
  return readType(type).sort((a, b) => a.title.localeCompare(b.title));
}
