import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import type { Locale } from "./site";

const TEAM_DIR = path.join(process.cwd(), "content", "team");

/**
 * People (clinicians, staff) and the organization that appear on /team and/or author blog
 * posts. One locale-neutral file per person at `content/team/<slug>.md`: frontmatter below,
 * body = English bio (HTML, faithful to the original /team cards). Read at BUILD time only via
 * `fs`, exactly like `lib/blog.ts` — every consumer must be statically generated
 * (`dynamicParams = false`), never a route handler / `proxy.ts` / `force-dynamic` path.
 * See docs/blog/AUTHORS.md.
 */
export const PersonSchema = z.object({
  name: z.string(),
  /** Role / position line, e.g. "Founder, LMFT" or "Intake Coordinator". */
  title: z.string().optional(),
  /** Licensure letters, only where the source states them (e.g. "LAPC"). Never invented. */
  credentials: z.string().optional(),
  /** Spoken languages, display form, e.g. ["English", "Spanish"]. */
  languages: z.array(z.string()).default([]),
  headshot: z.string().optional(),
  /** CSS `object-position` for the headshot crop, carried from the /team card. */
  objectPosition: z.string().optional(),
  /** Shown in the /team grid? Guest authors and the org are false. */
  teamMember: z.boolean().default(false),
  /** Display order within the /team grid. */
  order: z.number().optional(),
  /** The organization itself → JSON-LD `Organization`, not `Person` (used from Phase 5). */
  isOrg: z.boolean().default(false),
  /** Professional / social profiles for E-E-A-T `sameAs`. TODO for most. */
  links: z.record(z.string(), z.string()).default({}),
  /** Topics of expertise for JSON-LD `knowsAbout`. TODO for most. */
  knowsAbout: z.array(z.string()).default([]),
  /** Optional Spanish bio (HTML); falls back to the English body when absent. */
  bioEs: z.string().optional(),
});

export type Person = z.infer<typeof PersonSchema> & {
  slug: string;
  /** English bio (HTML) from the file body. */
  bioHtml: string;
};

let cache: Person[] | undefined;

/** Read + validate every person file. Memoized; BUILD-TIME only. */
function readAll(): Person[] {
  if (cache) return cache;
  const files = fs.existsSync(TEAM_DIR) ? fs.readdirSync(TEAM_DIR) : [];
  cache = files
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(TEAM_DIR, f), "utf8");
      const { data, content } = matter(raw);
      const parsed = PersonSchema.parse(data);
      return { ...parsed, slug: f.replace(/\.md$/, ""), bioHtml: content.trim() };
    });
  return cache;
}

export const getAllPeople = (): Person[] => readAll();

export const getPersonSlugs = (): string[] => readAll().map((p) => p.slug);

export const getPerson = (slug: string): Person | undefined =>
  readAll().find((p) => p.slug === slug);

/** Team members for the /team grid, in display order. */
export const getTeamMembers = (): Person[] =>
  readAll()
    .filter((p) => p.teamMember)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

/** Resolve an author slug → person, with the bio HTML for `lang` (English fallback). */
export function resolveAuthor(slug: string, lang: Locale): Person | undefined {
  const p = getPerson(slug);
  if (!p) return undefined;
  return { ...p, bioHtml: lang === "es" ? p.bioEs ?? p.bioHtml : p.bioHtml };
}

/** Byline link target: the org points at the team overview; people at their profile page. */
export const authorHref = (a: Pick<Person, "slug" | "isOrg">): string =>
  a.isOrg ? "/team" : `/team/${a.slug}`;
