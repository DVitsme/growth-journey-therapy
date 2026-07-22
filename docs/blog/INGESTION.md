# Blog ingestion workflow — turning a client brief into a live post

> How new blog posts get from a client-authored brief into a rendered `/blog/<slug>` page.
> Companion to [`ARCHITECTURE.md`](./ARCHITECTURE.md) (how the blog renders) and
> [`AUTHORS.md`](./AUTHORS.md) (author/JSON-LD system). Established 2026-07-22.

## Where the client drops a new post

```
content/blog/_inbox/<any-folder-name>/
  <brief>.md          ← the client's brief (any filename; one .md per folder)
  cover.<ext>         ← OPTIONAL image, if the client has one (jpg/png/webp)
```

This lives beside the content it becomes but is **never rendered** — `lib/blog.ts` reads only
`content/blog/en` and `content/blog/es`, so `_inbox/` is inert. After processing, the brief is
moved to `content/blog/_inbox/_processed/<slug>/` for provenance.

## The brief format (constant, from the client)

A single markdown file bundling **content + build instructions**:
- An author line at the top (e.g. *"a collaboration between Karla and Vivian"*).
- Title (H1), meta description, the full body (with `**bold**` pseudo-headings, lists,
  "In-the-moment script" callouts, and an Educational Disclaimer).
- A **"Tiny Website Editor Box"** — Title, **URL Slug**, Meta Description, keywords, Suggested H2s,
  Tags/Category.
- A **"Quick SEO checklist"** — including requested internal links.

The editor box + checklist are **directives to the processor, not post content** — they don't get
published.

## What the processor does

1. **Parse metadata** from the editor box → `title`, `slug`, `excerpt`/`seo.description`, `categories`.
2. **Convert the body** to clean markdown: bold pseudo-headings → `##`/`###`; the 10-tool
   sub-fields → bulleted lists; scripts → blockquotes; drop the editor box + checklist; keep the
   Educational Disclaimer (as a trailing italic note).
3. **Resolve authors** → a `content/team/` slug (see Authors below).
4. **Wire the requested internal links** (verify each target route exists first).
5. **Category**: add any new category to `CATEGORY_LABELS` in `lib/blog.ts`
   (e.g. `"trauma-recovery": "Trauma Recovery"`). *(Tags in the brief are not used yet — there's
   no tag system; captured here for a future feature if wanted.)*
6. **Image** (see below) → optimize → `public/images/blog/<slug>/cover.jpg`; set
   `coverImage`/`coverImageAlt`.
7. **Write** `content/blog/en/<slug>.md` with full frontmatter + body.
8. **Verify**: `tsc --noEmit` + `next build` + screenshot the rendered post.
9. **Archive** the brief → `content/blog/_inbox/_processed/<slug>/`.

## Authors

- Post frontmatter carries a single `author:` slug pointing at `content/team/<slug>.md`.
- **Co-authored posts** (current policy): credit the primary author in `author:`, acknowledge the
  co-author with a light in-body *"in collaboration with …"* note. *(Full multi-author support —
  `authors: [...]` across byline / profiles / JSON-LD — is a deferred enhancement; adopt it if
  collaborative posts become common.)*
- **A new author** (not yet in `content/team/`) must be onboarded first — real name, role/credential,
  headshot, bio, languages (same as adding a team member; see `source-images/team/README.md`). Never
  fabricate a clinician's identity or credentials. Until onboarded, credit an existing author.

## Images

- **If the client supplied `cover.*`** in the inbox folder → crop/optimize with `sharp` →
  `public/images/blog/<slug>/cover.jpg`.
- **If not** → source a free image (Pexels / Wikimedia Commons / Openverse). Record the source +
  photographer even when attribution isn't legally required. *(Practical: **Unsplash blocks
  direct download** — it needs their API — so its images can't be self-hosted via `curl`; prefer
  **Pexels** and **Wikimedia Commons (CC0)**, which download cleanly. Vet candidates by eye before
  choosing.)*
  - **Topic sensitivity matters.** For heavy subjects (trauma, grief, abuse), choose calming,
    grounding, hopeful imagery — never anything depicting distress or the event itself. Present
    2–3 vetted options for sign-off rather than auto-picking.
- Rendered at `aspect-[16/7]` (post hero) and `aspect-[3/2]` (index card); prefer landscape,
  ≥1600px wide.

## Output paths (recap)

| What | Where |
|---|---|
| Rendered post | `content/blog/en/<slug>.md` (or `es/` for Spanish) |
| Cover image | `public/images/blog/<slug>/cover.jpg` |
| Archived brief | `content/blog/_inbox/_processed/<slug>/` |

## Changelog
- **2026-07-22** — Workflow established; inbox moved to `content/blog/_inbox/`. First post ingested:
  *What to Expect After a Traumatic Assault* (author Karla Recalde, category Trauma Recovery).
