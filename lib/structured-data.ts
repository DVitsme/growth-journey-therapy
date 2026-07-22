/**
 * JSON-LD builders — one `@graph` per page (Google resolves shared `@id`s only within a page's
 * graph, so the Organization/WebSite identity nodes are included in every structured page).
 * Design validated against Google Search Central + schema.org (2026-07). See docs/blog/AUTHORS.md.
 *
 * Honesty / content-match rules (YMYL): only mark up what is TRUE and VISIBLE on the page.
 * - `author.name` is the name only; credentials live in `honorificSuffix` / `jobTitle`.
 * - No `hasCredential` is auto-generated from free-text titles (would risk asserting a license a
 *   pre-licensure staff member doesn't hold). Add structured credentials per-person later.
 * - `image` / `knowsAbout` / `sameAs` are omitted when we don't have them (no logos-as-image,
 *   no fabricated data).
 */
import { SITE, SITE_URL } from "./site";
import type { Locale } from "./site";
import type { Post } from "./blog";
import type { Person } from "./team";

const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`);

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO_ID = `${SITE_URL}/#logo`;

const LANG_CODE: Record<string, string> = { English: "en", Spanish: "es", Arabic: "ar" };
const langCodes = (langs: string[]) => langs.map((l) => LANG_CODE[l] ?? l.slice(0, 2).toLowerCase());

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
function truncate(s: string, n = 300): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trim()}…`;
}

/** The practice — publisher on every article, and author of house-written posts. */
function organizationNode() {
  return {
    "@type": ["MedicalBusiness", "Organization"],
    "@id": ORG_ID,
    name: SITE.name,
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      "@id": LOGO_ID,
      url: abs("/images/brand/logo-color.jpg"),
      contentUrl: abs("/images/brand/logo-color.jpg"),
      width: 512,
      height: 512,
      caption: SITE.name,
    },
    image: { "@id": LOGO_ID },
    telephone: SITE.phoneHref.replace("tel:", ""),
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.zip,
      addressCountry: "US",
    },
    areaServed: { "@type": "State", name: "Pennsylvania" },
    knowsLanguage: ["en", "es"],
  };
}

function webSiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": ORG_ID },
    inLanguage: ["en", "es"],
  };
}

/** Identity nodes included in every structured page's graph so `@id` refs resolve in-graph. */
const siteNodes = () => [organizationNode(), webSiteNode()];

/** Full Person node — lives once per person, on their ProfilePage. */
function personNode(person: Person) {
  const url = abs(`/team/${person.slug}`);
  const links = Object.values(person.links ?? {}).filter(Boolean);
  const description = truncate(stripHtml(person.bioHtml));
  const langs = langCodes(person.languages ?? []);
  return {
    "@type": "Person",
    "@id": `${url}#person`,
    name: person.name,
    url,
    worksFor: { "@id": ORG_ID },
    ...(person.title ? { jobTitle: person.title } : {}),
    ...(person.credentials ? { honorificSuffix: person.credentials } : {}),
    ...(person.headshot ? { image: abs(person.headshot) } : {}),
    ...(description ? { description } : {}),
    ...(langs.length ? { knowsLanguage: langs } : {}),
    ...(person.knowsAbout?.length ? { knowsAbout: person.knowsAbout } : {}),
    ...(links.length ? { sameAs: links } : {}),
  };
}

/** Lightweight author reference on an article: `@id` + `name` + `url` (the full node is on the
 *  profile page). Org-authored posts reference the Organization node by `@id`. */
function authorRef(person: Person) {
  if (person.isOrg) return { "@id": ORG_ID };
  const url = abs(`/team/${person.slug}`);
  return { "@type": "Person", "@id": `${url}#person`, name: person.name, url };
}

function webPageNode(url: string, name: string, lang: Locale, imageUrl?: string) {
  return {
    "@type": "WebPage",
    "@id": url,
    url,
    name,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: lang,
    ...(imageUrl ? { primaryImageOfPage: { "@type": "ImageObject", url: imageUrl } } : {}),
  };
}

/** Full JSON-LD document for a blog post. `author` is the resolved Person (or the org). */
export function blogPostingGraph(post: Post, author: Person) {
  const pageUrl = abs(`/blog/${post.slug}`);
  const imageUrl = post.coverImage ? abs(post.coverImage) : undefined;
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteNodes(),
      webPageNode(pageUrl, post.title, post.lang, imageUrl),
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#article`,
        isPartOf: { "@id": pageUrl },
        mainEntityOfPage: { "@id": pageUrl },
        headline: post.title,
        description: post.seo?.description ?? post.excerpt,
        datePublished: post.date,
        dateModified: post.date,
        inLanguage: post.lang,
        author: authorRef(author),
        publisher: { "@id": ORG_ID },
        ...(imageUrl ? { image: imageUrl } : {}),
      },
    ],
  };
}

/** Full JSON-LD document for a clinician/guest profile page. */
export function profileGraph(person: Person) {
  const pageUrl = abs(`/team/${person.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteNodes(),
      {
        "@type": "ProfilePage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${person.name}${person.title ? ` — ${person.title}` : ""}`,
        isPartOf: { "@id": WEBSITE_ID },
        inLanguage: "en",
        mainEntity: { "@id": `${pageUrl}#person` },
      },
      personNode(person),
    ],
  };
}

/** Site identity for the homepage (anchors the Organization/WebSite entity). */
export function homeGraph() {
  return { "@context": "https://schema.org", "@graph": siteNodes() };
}
