import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllPosts } from "@/lib/blog";
import { getMethodSlugs } from "@/lib/method-content";
import { GROUP_PAGE_SLUGS, getTopLevelSlugs } from "@/lib/pages";
import { getAllPeople } from "@/lib/team";

type Entry = MetadataRoute.Sitemap[number];
type Freq = Entry["changeFrequency"];

const BASE = SITE_URL.replace(/\/+$/, "");
const loc = (path = "") => `${BASE}${path}`;

/**
 * Sitemap for growthjourneytherapy.com (served at /sitemap.xml).
 *
 * Every dynamic section is enumerated from the SAME getters its route uses in
 * `generateStaticParams`, so the sitemap can never list a page that isn't built (or
 * miss one that is). Static/index routes are listed explicitly — they're stable.
 *
 * Runs at build time (Node), so `new Date(...)` and the fs-backed getters are fine.
 * NOTE: not actually crawled until launch — `app/robots.ts` currently blocks all
 * crawlers; the launch flip will allow crawling and reference this sitemap. (hreflang
 * alternates for the EN/ES pairs are a possible later enhancement.)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: Entry[] = [];

  // 1) Static + section-index routes (mirror app/*/page.tsx with no dynamic segment).
  const staticRoutes: Array<[path: string, priority: number, freq: Freq]> = [
    ["", 1.0, "monthly"],
    ["/methods", 0.8, "monthly"],
    ["/specialties", 0.8, "monthly"],
    ["/team", 0.8, "monthly"],
    ["/groups", 0.7, "monthly"],
    ["/blog", 0.7, "weekly"],
    ["/contact", 0.6, "yearly"],
    ["/contacto", 0.6, "yearly"],
    ["/careers", 0.5, "yearly"],
    ["/schedule-now", 0.5, "yearly"],
  ];
  for (const [path, priority, changeFrequency] of staticRoutes) {
    entries.push({ url: loc(path), changeFrequency, priority });
  }

  // 2) Blog posts (EN + ES) — real lastModified from frontmatter `date`.
  for (const post of getAllPosts()) {
    const d = new Date(post.date);
    entries.push({
      url: loc(`/blog/${post.slug}`),
      lastModified: Number.isNaN(d.getTime()) ? undefined : d,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // 3) Therapy method + specialty pages.
  for (const slug of getMethodSlugs("method")) {
    entries.push({ url: loc(`/methods/${slug}`), changeFrequency: "monthly", priority: 0.7 });
  }
  for (const slug of getMethodSlugs("specialty")) {
    entries.push({ url: loc(`/specialties/${slug}`), changeFrequency: "monthly", priority: 0.7 });
  }

  // 4) Bespoke top-level pages (mirror app/[slug]: exclude "team", which has its own route).
  for (const slug of getTopLevelSlugs().filter((s) => s !== "team")) {
    entries.push({ url: loc(`/${slug}`), changeFrequency: "monthly", priority: 0.6 });
  }

  // 5) Free group detail pages (/groups/<slug>).
  for (const slug of GROUP_PAGE_SLUGS) {
    entries.push({ url: loc(`/groups/${slug}`), changeFrequency: "monthly", priority: 0.5 });
  }

  // 6) Clinician + author profile pages (mirror app/team/[slug]: people only, no org).
  //    Exclude the "vivian" stub — a former team member whose profile is an incomplete
  //    placeholder (pending re-attribution of her posts + profile removal; see the TODO).
  //    The route still builds it (she's a byline author), so this is a sitemap-only exclusion.
  for (const person of getAllPeople().filter((p) => !p.isOrg && p.slug !== "vivian")) {
    entries.push({ url: loc(`/team/${person.slug}`), changeFrequency: "monthly", priority: 0.6 });
  }

  return entries;
}
