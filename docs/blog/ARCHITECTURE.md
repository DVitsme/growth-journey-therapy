# Blog architecture — how it works

> Living reference for the `/blog` subsystem. **Update this doc as we change the blog.**
> Last verified against the code: 2026-07-21.

## Philosophy

The blog is **files compiled at build time** — no CMS, no database, no auth, no runtime
`fs` reads. Every page is statically generated (`dynamicParams = false`) so it deploys as
flat assets on **OpenNext / Cloudflare Workers**. To change content you edit a markdown
file and rebuild.

## File map

| Path | Role |
|---|---|
| `content/blog/en/*.md` | English posts (26) — frontmatter + markdown body |
| `content/blog/es/*.md` | Spanish posts (2) |
| `lib/blog.ts` | Data layer — reads/parses posts, sorting, lookups, translation, labels, dates |
| `lib/markdown.ts` | `renderMarkdown()` — markdown → sanitized HTML (re-exported from `lib/blog.ts`) |
| `content/team/*.md` | People dataset — clinicians, staff, org, guest authors (author data; see [`AUTHORS.md`](./AUTHORS.md)) |
| `lib/team.ts` | People data layer — `getPerson`, `getTeamMembers`, `resolveAuthor`, `authorHref`; source of valid author slugs |
| `components/site/author-byline.tsx` | Byline UI — `AuthorByline` (post header) + `AuthorBylineCompact` (cards); avatar = photo / Sprout (org) / initials |
| `app/team/[slug]/page.tsx` | Author/clinician profile pages — headshot, credential, full bio, "Articles by …"; byline link target |
| `app/team/page.tsx` | `/team` grid — story intro + CTA from `team.json`, member cards built from `content/team/` (single source) |
| `lib/structured-data.ts` | JSON-LD `@graph` builders — `blogPostingGraph` / `profileGraph` / `homeGraph` (Org · WebSite · Person · BlogPosting · ProfilePage) |
| `lib/json-ld.ts` · `components/site/json-ld.tsx` | XSS-safe serializer + `<JsonLd>` `<script>` emitter (posts, profiles, homepage) |
| `app/blog/page.tsx` | Blog index (card grid) |
| `app/blog/[slug]/page.tsx` | Single post (header + cover + prose body) |
| `public/images/blog/<slug>/cover.{jpg,jpeg,png}` | Per-post cover images (18 of 28 posts have one) |

**Counts today:** 28 posts (26 EN + 2 ES), 18 with cover images, 2 EN↔ES translation pairs.

`lib/blog.ts` is imported **only** by the two blog routes. Nothing else on the site (e.g.
the home page) surfaces posts — a "latest posts" module anywhere else would be new wiring.

## Data model (frontmatter)

Parsed with `gray-matter`. `PostMeta` type in `lib/blog.ts`:

| Key | Type | Notes |
|---|---|---|
| `title` | string | required |
| `slug` | string | required; falls back to filename if missing |
| `date` | string | `YYYY-MM-DD`; used for sort (desc) and display |
| `lang` | `"en" \| "es"` | drives locale badge, `hreflang`, date formatting |
| `excerpt` | string | shown on cards; default meta description |
| `categories` | string[] | inline array e.g. `["psychology"]`. **Only `categories[0]` is ever displayed.** |
| `author` | string (slug) | references `content/team/<slug>.md` (e.g. `growth-journey-therapy`, `raisa-roa-luna`); the build **throws** on an unknown slug. Byline UI still pending. |
| `draft` | boolean | `true` hides from index and yields no static route |
| `coverImage` | string? | `/images/blog/<slug>/cover.*` |
| `coverImageAlt` | string? | falls back to `title` |
| `translationKey` | string? | the **EN slug** shared by a translation pair (see below) |
| `seo.description` | string? | overrides `excerpt` for meta description |
| `source`, `originalUrl` | string? | provenance from the WordPress recovery; not rendered |

## Data layer — `lib/blog.ts`

`readAll()` reads + parses **every** file on each call (no memoization; fine at build
scale). Public functions:

- `getAllPosts()` — all posts, **drafts filtered out**, sorted by `date` desc.
- `getPostSlugs()` — slugs from `getAllPosts()` (so **drafts excluded** from static params).
- `getPost(slug)` — single post via `readAll()`; **does not** filter drafts, but with
  `dynamicParams = false` a draft has no generated route, so it 404s publicly anyway.
- `getTranslation(post)` — the opposite-language counterpart (see below).
- `categoryLabel(slug)` — maps category slug → display label via a hardcoded
  `CATEGORY_LABELS` map (`stress`, `self-identity`, `family-life`, `philadelphia`,
  `psychology`, `psicologia`, `uncategorized → "Reflections"`); unknown slugs are
  title-cased.
- `formatDate(iso, lang)` — locale-aware (`es-ES` / `en-US`), UTC.
- `getPostsByAuthor(slug)` — reverse index: published posts by an author slug, newest first.

`readAll()` also runs `assertKnownAuthors()` — the build **throws** if any post's `author`
slug has no `content/team/<slug>.md` (valid slugs come from `lib/team.ts`).

## Markdown rendering — `lib/markdown.ts`

`renderMarkdown(md)` pipeline: `unified` → `remark-parse` → `remark-gfm` →
`remark-rehype` → **`rehype-sanitize`** → `rehype-stringify`. Output HTML is injected via
`dangerouslySetInnerHTML` on the detail page. Sanitization means **raw HTML / scripts in
markdown are stripped** — safe against the recovered content, but also means custom HTML
embeds won't render unless the sanitize schema is extended.

## Routes & UI

### Index — `app/blog/page.tsx`
- `PageHero` (green banner) + a responsive card grid: `sm:grid-cols-2 lg:grid-cols-3`.
- Card: cover image (`aspect-[3/2]`, `object-cover`, hover-zoom) **or** an `om-hatch`
  hatched placeholder when there's no cover; first-category `btn-label`; an "Español" badge
  for ES posts; title; excerpt; **compact author byline**; `formatDate`; "Read →".
- **EN and ES posts share one grid** — no locale separation beyond the badge.
- Static metadata; `canonical: /blog`.

### Single post — `app/blog/[slug]/page.tsx`
- `generateStaticParams()` from `getPostSlugs()`.
- `generateMetadata()` — title, description (`seo.description ?? excerpt`), `canonical`,
  `languages` hreflang alternates (when a translation exists), OpenGraph `article`
  (locale, `publishedTime`, cover image).
- Layout: cream header (back link, category/date/Español, `h1`, **author byline**, translation
  cross-link) → optional cover (`aspect-[16/7]`, `priority`) → prose body → bottom back link.
- Body prose: `prose prose-lg max-w-prose prose-headings:font-display
  prose-headings:text-green prose-a:text-green …` (`@tailwindcss/typography`).

## Styling hooks

Tailwind v4 (CSS-first, `app/globals.css`), `@plugin "@tailwindcss/typography"`. Brand
utilities used by the blog: `container-page` (max 1500px, `px-6`), `btn-label` (uppercase
label), `om-hatch` (hatched placeholder fill), `bg-paper` / `bg-cream` / `bg-panel`,
`text-green` / `text-ink` / `text-ink-soft`. Reading measure `--container-prose: 68ch`.

## Translations

An EN↔ES pair is linked by **both** files carrying `translationKey` = the **EN** slug.
`getTranslation()`:
```ts
if (post.translationKey) return all.find(p => p.slug === post.translationKey); // else…
return all.find(p => p.translationKey === post.slug);                          // reverse lookup
```
Design intent (per the code comment): **ES posts carry `translationKey`; EN posts do not**,
and EN finds its ES counterpart via the reverse lookup. The two pairs today are
`what-is-cultural-deprivation ↔ que-es-la-deprivacion-cultural` and
`your-turn-committed-students ↔ tu-turno-estudiantes`.

## Images

All local under `public/images/blog/<slug>/cover.{jpg,jpeg,png}` (mixed extensions).
Rendered with `next/image` (`fill` + `object-cover`). 10 posts have no cover and use the
`om-hatch` placeholder. No inline body images exist yet (sanitized markdown + local paths
would be required to add them).

## Known gaps (not built yet)

- **Author system: complete (Phases 1–5).** `content/team/` is the single source of truth for
  the `/team` grid, `/team/[slug]` profiles, and blog bylines; `Person` / `BlogPosting` /
  `ProfilePage` / `Organization` JSON-LD ships with a shared `@id`. **Optional client
  enhancements** (each auto-flows into the JSON-LD once filled): per-person `links` → `sameAs`,
  `knowsAbout` topics, Spanish bios, structured `hasCredential`, and reattributing the 24
  org-authored posts to specific clinicians. *(Full plan/research in [`AUTHORS.md`](./AUTHORS.md).)*
- **No category browsing / filtering, no tags UI, no pagination** — all 28 posts render on
  one page; only `categories[0]` is shown, as a static label.
- **No related posts, reading time, or author byline on cards.**
- **ES is not first-class** — 2 Spanish posts sit inline in the same feed; no `/es` routing
  or locale filter.
- **SEO parked:** `app/robots.ts` blocks all crawling (preview state), there's **no
  `sitemap.ts`**, and legacy dated permalinks (`/YYYY/MM/DD/slug/`) aren't redirected
  (no `proxy.ts`). All slated for the SEO pass.

## Known bugs

- **`getTranslation` self-reference** — both EN posts in the pairs
  (`what-is-cultural-deprivation`, `your-turn-committed-students`) currently set
  `translationKey` to **their own slug**, contradicting the design intent above. Because the
  first branch matches on `slug === translationKey`, `getTranslation` returns the post
  itself, so on those **English** pages the "También disponible en español" link points back
  to the same English page, and `generateMetadata` emits both `en`/`es` hreflangs at the EN
  URL. ES→EN works. Fix: remove `translationKey` from EN posts (rely on reverse lookup), or
  make `getTranslation` exclude self / require opposite `lang`.

## Adding a post (quick)

1. Create `content/blog/<lang>/<slug>.md` with the frontmatter above (`draft: false`).
2. Optional cover at `public/images/blog/<slug>/cover.jpg` + set `coverImage`/`coverImageAlt`.
3. For a translation, set `translationKey` to the **EN** slug on the ES file (see the bug
   note before touching EN files).
4. `pnpm build` (or `pnpm dev`) — the post is picked up automatically.

## Changelog

- **2026-07-21** — Initial architecture capture (pre-authors work). Added
  [`AUTHORS.md`](./AUTHORS.md) (author-data plan + research).
- **2026-07-21** — Authors Phase 1: `content/team/` dataset + `lib/team.ts`; `author` frontmatter
  is now a validated slug (28 posts repointed). Bylines/pages pending.
- **2026-07-21** — Authors Phase 2: byline UI (`components/site/author-byline.tsx`) on post pages
  and index cards; unlinked until `/team/[slug]` lands in Phase 3.
- **2026-07-21** — Authors Phase 3: `app/team/[slug]/page.tsx` profile pages (8: 7 clinicians +
  guest; org excluded). Bylines now link (`authorHref`: org → `/team`, people → profile).
- **2026-07-21** — Authors Phase 4: `/team` grid built from `content/team/` via `app/team/page.tsx`
  (byte-identical to the old inline cards); member data removed from `team.json` (`/team` excluded
  from the `[slug]` route). Single source of truth established.
- **2026-07-21** — Authors Phase 5: JSON-LD (`lib/structured-data.ts` + `<JsonLd>`) on posts
  (`BlogPosting`), profiles (`ProfilePage`+`Person`), homepage (`Organization`+`WebSite`) — shared
  `@id`, bilingual; Next metadata `authors`/OG `article:author`. **Author build complete.**
