import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export type PageType = "method" | "specialty" | "overview" | "bespoke";

export type PageDoc = {
  slug: string;
  type: PageType;
  lang: "en" | "es";
  title: string;
  heroImage?: string;
  heroImageAlt?: string;
  excerpt: string;
  seo?: { description?: string };
  cta?: { text: string; href: string };
  content: string;
};

function readAll(): PageDoc[] {
  if (!fs.existsSync(PAGES_DIR)) return [];
  const docs: PageDoc[] = [];
  for (const type of fs.readdirSync(PAGES_DIR)) {
    const dir = path.join(PAGES_DIR, type);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      docs.push({
        ...(data as Omit<PageDoc, "content">),
        type: type as PageType,
        slug: (data.slug as string) ?? file.replace(/\.md$/, ""),
        content,
      });
    }
  }
  return docs;
}

export function getPage(slug: string): PageDoc | undefined {
  return readAll().find((p) => p.slug === slug);
}

export function getPagesByType(type: PageType): PageDoc[] {
  return readAll()
    .filter((p) => p.type === type)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** The four group-detail pages live under `/groups/<slug>` (their original WordPress URLs). */
export const GROUP_PAGE_SLUGS = [
  "free-spanish-speaking-caregiver-support-group-for-caregivers-of-children-0-8-years-old-includes-prenatal",
  "free-spanish-speaking-childrens-engagement-group-children-8-years-old-and-younger",
  "grupo-gratis-de-apoyo-para-cuidadores-en-espanol-para-cuidadores-de-ninos-de-0-8-anos-incluye-personas-embarazadas",
  "grupo-gratis-en-espanol-para-ninos-de-8-anos-o-menores-en-filadelfia-apoyo-con-habilidades-sociales-emociones-comunicacion-y-juego-en-grupo",
] as const;

/** Pages rendered at the root (`/<slug>`): the bespoke prose pages. Methods/specialties are nested + structured. */
export function getTopLevelSlugs(): string[] {
  return readAll()
    .filter((p) => p.type === "bespoke")
    .map((p) => p.slug)
    // `careers` has its own route (app/careers); group details live under /groups/<slug>.
    .filter((slug) => slug !== "careers" && !GROUP_PAGE_SLUGS.includes(slug as (typeof GROUP_PAGE_SLUGS)[number]));
}
