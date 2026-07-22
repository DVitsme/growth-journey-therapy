import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getPersonSlugs } from "./team";

export { renderMarkdown } from "./markdown";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type Locale = "en" | "es";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  lang: Locale;
  excerpt: string;
  categories: string[];
  author: string;
  draft: boolean;
  coverImage?: string;
  coverImageAlt?: string;
  translationKey?: string;
  seo?: { description?: string };
  source?: string;
  originalUrl?: string;
};

export type Post = PostMeta & { content: string };

/** Read + parse every markdown file. Runs at build time (pages are statically generated). */
function readAll(): Post[] {
  const posts: Post[] = [];
  for (const lang of ["en", "es"] as const) {
    const dir = path.join(BLOG_DIR, lang);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      posts.push({
        ...(data as PostMeta),
        lang,
        slug: (data.slug as string) ?? file.replace(/\.md$/, ""),
        categories: (data.categories as string[]) ?? [],
        content,
      });
    }
  }
  assertKnownAuthors(posts);
  return posts;
}

/** Fail the build if any post references an author with no `content/team/<slug>.md`. */
function assertKnownAuthors(posts: Post[]): void {
  const known = new Set(getPersonSlugs());
  for (const p of posts) {
    if (!p.author || !known.has(p.author)) {
      throw new Error(
        `[blog] Post "${p.slug}" (${p.lang}) references unknown author "${p.author}". ` +
          `Add content/team/${p.author}.md or fix the post's frontmatter.`,
      );
    }
  }
}

export function getAllPosts(): Post[] {
  return readAll()
    .filter((p) => !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Published posts authored by a given team/person slug, newest first. */
export function getPostsByAuthor(slug: string): Post[] {
  return getAllPosts().filter((p) => p.author === slug);
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getPost(slug: string): Post | undefined {
  return readAll().find((p) => p.slug === slug);
}

/** ES posts carry `translationKey` = the EN slug; EN posts are found by the reverse lookup. */
export function getTranslation(post: Post): Post | undefined {
  const all = readAll();
  if (post.translationKey) return all.find((p) => p.slug === post.translationKey);
  return all.find((p) => p.translationKey === post.slug);
}

const CATEGORY_LABELS: Record<string, string> = {
  stress: "Stress",
  "self-identity": "Self Identity",
  "family-life": "Family Life",
  philadelphia: "Philadelphia",
  psychology: "Psychology",
  psicologia: "Psicología",
  "trauma-recovery": "Trauma Recovery",
  uncategorized: "Reflections",
};

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(iso: string, lang: Locale = "en"): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
