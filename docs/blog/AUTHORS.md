# Blog authors — data association (no database)

> Plan + research note for attaching structured author data to posts. **Living doc — update
> as we build.** Companion to [`ARCHITECTURE.md`](./ARCHITECTURE.md).
> Research: 2026-07-21 (5-track web survey). **Decision (2026-07-21): Approach A — unified
> people dataset + `/team/[slug]` profile pages.** See "Open decisions".

## TL;DR

Associate authors with posts using a **local people dataset keyed by a slug** — built as
`content/team/` (unified with the /team page, per Decision A) — referenced from each post's
`author:` frontmatter and **joined at build** by a small `lib/team.ts` that mirrors the
existing `lib/blog.ts`. **No database, no CMS, no new
build dependency, no runtime `fs`.** This is what the repo already does for content — it's
an additive change, not a new system. All five research tracks converged on this.

The "relation" is a dictionary lookup on a slug — which is literally all a `reference()`
field in Astro/Keystatic/Content Collections compiles down to. For ~7 authors, a framework
to manage that is over-engineering.

## Current state (why this is greenfield)

- **All 28 posts** carry `author: "Growth Journey Therapy"` — no per-clinician attribution.
- The only human bylines ("**Raisa E. Roa Luna**") live in **post bodies**, not frontmatter,
  and that author is **not** on the current team roster (a guest/former contributor).
- `/team` is a **single bespoke page** (`content/pages/bespoke/team.json`); the 7 members are
  inline `card` objects (name/title/languages/objectPosition). **There are no `/team/[slug]`
  routes and no structured per-person dataset.**
- **No JSON-LD / structured-data infra exists yet** anywhere on the site.
- Org identity for `publisher`/`Organization` schema already lives in `lib/site.ts`.

Team roster today (from `team.json`): Nelsery De Leon (Founder), Nelendy De Leon (Clinician),
Karla Recalde (LAPC), Christina Holiday (Clinical Staff), Anne Marie (Student Clinician),
Eliana Liranzo (Intake Coordinator), Gina Rawashdeh (Clinical Student Intern).

## Recommended data model

One file per author, locale-neutral, slug = filename:

```
content/team/                   # AS BUILT (unified w/ team page); "authors" naming below is the generic research form
  growth-journey-therapy.md     # the org — default/legacy byline
  karla-recalde.md
  raisa-roa-luna.md             # guest author, not on team
  …
```

```md
---
slug: karla-recalde
name: Karla Recalde
title: Licensed Associate Professional Counselor   # credential → shown in byline & JSON-LD jobTitle
languages: [en, es]
headshot: /images/team/cards/karla-recalde.jpg      # reuse the cropped /team headshots
teamMember: true                                    # is this person on /team?
links:
  psychologyToday: https://…
  linkedin: https://…
knowsAbout: [Anxiety, Trauma, EMDR, Bilingual therapy]  # feeds Person JSON-LD
bio:
  en: |
    Karla helps clients navigate…
  es: |
    Karla ayuda a sus clientes…
---
```

Post frontmatter changes from a display string to a **slug reference** (optionally an array
for co-authors / "reviewed by"):

```yaml
author: karla-recalde          # was: "Growth Journey Therapy"
# or, later, multi-author:
# authors: [karla-recalde]
# reviewedBy: nelsery-de-leon   # optional YMYL "clinically reviewed by" line
```

### `lib/authors.ts` (build-time join, ~40 lines)

Mirror `lib/blog.ts`: `node:fs` + `gray-matter`, **memoized**, build-time only.

```ts
export type Author = {
  slug: string; name: string; title?: string; languages: Locale[];
  headshot?: string; teamMember?: boolean;
  links?: Record<string, string>; knowsAbout?: string[];
  bio: Partial<Record<Locale, string>>;
};
export function getAuthor(slug: string): Author | undefined { /* readdir+matter, cached */ }
export function getAuthorSlugs(): string[] { /* … */ }
/** slug → record, bio picked for post lang, EN fallback */
export function resolveAuthor(slug: string, lang: Locale) { /* … */ }
/** reverse index: author slug → their posts, date desc (for author pages) */
export function getPostsByAuthor(slug: string): PostMeta[] { /* iterate getAllPosts() */ }
```

### Build-time validation (do this — the framework won't)

Astro 5 **stopped** failing the build on broken references, so don't rely on any framework
to catch a typo'd author slug. Validate ourselves: load author slugs first, then Zod-`.refine`
every post's `author` against that set so `next build` throws on an unknown author.

```ts
const authorSlugs = new Set(getAuthorSlugs());
const PostFM = z.object({
  author: z.string().refine((s) => authorSlugs.has(s), "unknown author slug"),
  /* …other frontmatter… */
});
```

### i18n

Author entity is **one locale-neutral record**; both the EN and ES post reference the same
slug. Bilingual bios live as `bio.en` / `bio.es` in the one file (EN fallback). Never fork
the author identity per language — critical for the shared JSON-LD `@id` (below).

### Cloudflare / static safety

- `fs` reads are safe **only at build**; every consumer must be a statically-generated
  server component (`dynamicParams = false`). Never call from a route handler, `proxy.ts`,
  or `force-dynamic` path, or the Worker attempts a runtime `fs` read that doesn't exist.
- **Zero-`fs` variant** if we want to be bulletproof: make it `content/authors.ts` exporting a
  typed `Record<slug, Author>` and `import` it — bundles into the Worker, no filesystem at
  all. Slightly worse DX for long bios. (Matches how `lib/nav.ts` / `lib/site.ts` work today.)

## SEO / E-E-A-T (this is a YMYL health site — it matters)

Author credibility is a real ranking lever for therapy content. Priority order:

1. **Visible, credentialed byline on every post, linked to a real author page.** Biggest lever.
   Show headshot + "By {Name}, {Credential}" near the title; optional expanded author card at
   the foot. For staff-drafted + clinician-reviewed posts, add "Medically reviewed by {Name},
   {Credential}" — the reviewer carries the YMYL weight.
2. **A real author profile page** with license/credential, specialties, headshot. (See the
   open decision — reuse/extend `/team` vs. a new `/blog/author/[slug]`.)
3. **JSON-LD** `BlogPosting` → `author` as a `Person` with a **stable `@id` reused across
   every post and the profile page** so Google merges one entity. `author.name` = name only
   (credential goes in `jobTitle`), plus `url`, `image`, `knowsAbout`, `worksFor`, and
   `sameAs` (Psychology Today / license lookup — strongest disambiguation for clinicians).
   Emit `ProfilePage` + matching `Person` `@id` on the profile page.
4. **Next Metadata API** (hygiene, not a ranking driver): `authors: [{name, url}]` →
   `<meta name=author>` + `<link rel=author>`; `openGraph.article.authors: [profileURL]`.
   Rich results come from the **JSON-LD**, not these tags.

Compact target JSON-LD lives in the research appendix below.

## Open decisions

1. **Author identity & profile-page strategy** — ✅ **DECIDED: Approach A.** One unified people
   dataset powers the `/team` cards *and* blog bylines; per-member `/team/[slug]` profile pages
   are the byline + JSON-LD `@id` target. Requires a new `/team/[slug]` route and migrating the
   inline `team.json` cards into per-person records (preserving the current `/team` look 1:1).
   - ~~B. Separate `content/authors/`, byline links into `/team` anchor.~~ (not chosen)
   - ~~C. Bylines + JSON-LD now, defer author pages.~~ (not chosen)
2. **Multi-author / "reviewed by"** — single `author` slug now, or `authors[]` + `reviewedBy`
   from the start?
3. **Editing UI** — recommend **hand-edit for now** (no CMS; ~7 authors change rarely). If the
   client later wants to self-author posts, **Sveltia CMS** is the static-Cloudflare-safe pick
   (see appendix). Not warranted yet.

## Implementation sketch (once decided)

1. ✅ `content/team/` seed files — 9 records (7 team members from `team.json`, the org, guest Raisa).
2. ✅ `lib/team.ts` (memoized build join, Zod `PersonSchema`) + build-time slug validation in `lib/blog.ts` (`assertKnownAuthors`).
3. ✅ Repoint post `author:` → slugs (28 posts: 24 → `growth-journey-therapy`, 4 → `raisa-roa-luna`).
4. ✅ Byline UI — `AuthorByline` (post header) + `AuthorBylineCompact` (index cards); unlinked until Phase 3.
5. ✅ JSON-LD — `lib/structured-data.ts` (`@graph` per page) + `lib/json-ld.ts` serializer +
   `<JsonLd>`: `BlogPosting` on posts, `ProfilePage`+`Person` on profiles, `Organization`+
   `WebSite` on the homepage; shared `@id`, bilingual; Next metadata `authors`/OG added.
   Honesty-safe: `author.name` name-only, no auto `hasCredential`, unknown fields omitted.
   **Validate with:** Schema Markup Validator (validator.schema.org) for the whole `@graph`;
   Rich Results Test for `BlogPosting` (Person/ProfilePage/Org correctly show "no rich result").
6. ✅ Author profile pages — `app/team/[slug]/page.tsx` (8 pages: 7 clinicians + guest; org
   excluded), `generateStaticParams` + `dynamicParams=false`; bylines link via `authorHref`
   (org → `/team`). Full bio, credentials, "Articles by …".
7. Update [`ARCHITECTURE.md`](./ARCHITECTURE.md) + this doc's changelog.

---

## Research appendix

Five parallel web-research tracks (2026-07-21). Findings condensed; sources kept.

### Verdict across tracks
All five converged: **stay on `gray-matter` + a small typed helper; no DB, no CMS, no
content-layer framework** for this scale. Adopt heavier tooling only on real growth.

### Content-layer libraries (only if the blog grows a lot)

| Library | Typed + relations | Maintained '25–'26 | Next16+Turbopack+CF | Verdict |
|---|---|---|---|---|
| **Content Collections** | Zod + first-class `reference()` | ✅ active (Jun 2026) | ✅ Turbopack issue closed | Only lib worth adopting **if** enforced relations at scale are wanted |
| **Velite** | Zod, **no** relations (hand-join) | ✅ very active | ✅ (CLI/`next.config` build) | Great general tool, **no relation benefit** here |
| **Contentlayer2** | manual relations | ❌ stale (May 2025) | ❌ webpack vs Turbopack | **Skip** |
| **Fumadocs** | Zod, no first-class relations | ✅ active | ✅ | Docs framework — **overkill** |
| ~~Contentlayer~~ (orig) | — | ❌ dead | — | **Do not adopt** |

### Git-based CMS (only if the client will self-author)

| CMS | Relation field | File-based, no DB | Admin on static CF | Verdict |
|---|---|---|---|---|
| **Sveltia** ⭐ | ✅ `relation` (i18n `{{locale}}`) | ✅ commits via GitHub API | ✅ SPA + tiny auth Worker | **Pick if a UI is needed** — Cloudflare-native, bilingual, actively maintained |
| **Keystatic** | ✅ `relationship` | ✅ | ⚠️ local-dev mode, or Node routes on the Worker | Typed Next-native; fits only in local mode |
| **Pages CMS** | ✅ | ✅ | ✅ hosted GitHub App | Clean zero-infra; less proven |
| ~~Decap~~ | ✅ (single-collection) | ✅ | ✅ | Declining; **superseded by Sveltia** |
| ~~TinaCMS~~ | ✅ | ❌ **needs a DB** | ❌ needs GraphQL backend | **Eliminate** (violates no-DB) |

**A CMS is not warranted now** — the relation it produces is a slug string in frontmatter,
same as hand-editing; and it re-adds an auth/secret surface this (post-compromise) site
deliberately removed.

### Reference-relation pattern (design source: Astro `reference()`)

Store only a slug in frontmatter → resolve at build → **validate refs yourself** (Astro 5
dropped build-time existence checks; use Zod `.refine`). Forward edge (post→author) is stored;
reverse edge (author→posts) is computed by grouping posts by author slug and sorting by date.
Keep the author a single shared entity across locales.

### Target JSON-LD (therapist author)

```json
{
  "@context": "https://schema.org", "@type": "BlogPosting",
  "headline": "…", "datePublished": "2026-01-15", "dateModified": "2026-02-01",
  "inLanguage": "en", "mainEntityOfPage": "https://growthjourneytherapy.com/blog/…",
  "author": {
    "@type": "Person",
    "@id": "https://growthjourneytherapy.com/team/karla-recalde#person",
    "name": "Karla Recalde",
    "url": "https://growthjourneytherapy.com/team/karla-recalde",
    "jobTitle": "Licensed Associate Professional Counselor",
    "image": "https://growthjourneytherapy.com/images/team/cards/karla-recalde.jpg",
    "knowsAbout": ["Anxiety", "Trauma", "EMDR", "Bilingual therapy"],
    "worksFor": { "@type": "MedicalBusiness", "name": "Growth Journey Therapy" },
    "sameAs": ["https://www.psychologytoday.com/us/therapists/…", "https://www.linkedin.com/in/…"]
  },
  "publisher": { "@type": "Organization", "name": "Growth Journey Therapy",
    "logo": { "@type": "ImageObject", "url": "https://growthjourneytherapy.com/images/brand/logo.png" } }
}
```
Reuse the **same `Person` `@id`** in EN and ES posts and on the profile page (`ProfilePage` →
`Person`). One entity across languages.

### Sources

Data model / file pattern:
- Smashing Magazine — Multi-Author Blog with Next.js: https://www.smashingmagazine.com/2021/06/creating-multi-author-blog-nextjs/
- TinaCMS — Simple Markdown Blog with Next.js: https://tina.io/blog/simple-markdown-blog-nextjs
- Wisp — Contentlayer abandoned, alternatives: https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives

Content-layer libraries:
- Content Collections — transform / `reference()`: https://www.content-collections.dev/docs/transform · Next adapter: https://www.content-collections.dev/docs/adapter/next · releases: https://github.com/sdorra/content-collections/releases
- Velite × Next.js: https://velite.js.org/guide/with-nextjs · repo: https://github.com/zce/velite
- Contentlayer2 releases: https://github.com/timlrx/contentlayer2/releases
- Next 16 upgrade (webpack plugins now fail): https://nextjs.org/docs/app/guides/upgrading/version-16

Relation pattern:
- Astro content collections / references: https://docs.astro.build/en/guides/content-collections/ · reference API: https://docs.astro.build/en/reference/modules/astro-content/ · ref no longer validated: https://github.com/withastro/astro/issues/13268
- Keystatic relationship field: https://keystatic.com/docs/fields/relationship · Tina reference: https://tina.io/docs/reference/types/reference · Zod: https://zod.dev/

Git-based CMS:
- Sveltia repo: https://github.com/sveltia/sveltia-cms · auth Worker: https://github.com/sveltia/sveltia-cms-auth · relation field: https://sveltiacms.app/en/docs/fields/relation
- Keystatic GitHub mode: https://keystatic.com/docs/github-mode · Decap review 2026: https://www.luckymedia.dev/insights/decap-cms · Pages CMS: https://pagescms.org/docs/

SEO / E-E-A-T:
- Google — Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article · Profile page: https://developers.google.com/search/docs/appearance/structured-data/profile-page · Helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content · Quality Rater Guidelines (PDF): https://services.google.com/fh/files/misc/hsw-sqrg.pdf
- schema.org Person: https://schema.org/Person · Next.js generateMetadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Therapist YMYL/E-E-A-T: https://crownsvillemedia.com/therapist-ymyl-and-e-e-a-t

## Changelog

- **2026-07-21** — Initial research + plan (5-track survey).
- **2026-07-21** — Decision: **Approach A** (unified people dataset + `/team/[slug]` pages).
- **2026-07-21** — **Phase 1 built:** `content/team/` (9 records), `lib/team.ts`, build-time
  author-slug validation, 28 posts repointed (24 → org, 4 → `raisa-roa-luna`). `tsc` clean.
- **2026-07-21** — **Phase 2 built:** byline component (`AuthorByline` + `AuthorBylineCompact`)
  on post pages and index cards. Org → Sprout mark, guest → initials. Unlinked pending Phase 3.
  `tsc` + `next build` green; screenshots verified (desktop + mobile).
- **2026-07-21** — **Phase 3 built:** `/team/[slug]` profile pages (8), byline links flipped on
  (`authorHref`). Verified: status codes (profiles 200, org/unknown 404, `/team` intact), byline
  hrefs in served HTML, screenshots (Karla/Raisa/Eliana, desktop + mobile). `tsc` + build green.
- **2026-07-21** — **Phase 4 built:** `/team` grid unified onto `content/team/` (`app/team/page.tsx`,
  `/team` excluded from `[slug]`); member cards removed from `team.json` (10 → 3 blocks). Verified
  **byte-identical** `/team` screenshots (desktop + mobile) vs. baseline — zero regression. `tsc` + build green.
- **2026-07-21** — **Phase 5 built:** JSON-LD (`BlogPosting`/`Person`/`ProfilePage`/`Organization`,
  shared `@id`, bilingual) + Next metadata author/OG, after an 8-agent research pass. Validated live:
  30+ structure/honesty assertions pass (entity `@id` linkage incl. same person `@id` across EN/ES,
  name-only authors, no fabricated credentials, content-matched NAP). `tsc` + build green.
  **✅ Author build complete (Phases 1–5).**
