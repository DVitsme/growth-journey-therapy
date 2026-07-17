# Growth Journey Therapy — Migration Dossier
**Definitive plan. Compiled 2026-07-09 from 10 recon agents + 4 adversarial verifiers.**
Where recon and a verifier disagreed, **the verifier wins** and it is called out inline.

Target stack (verified in repo): Next.js **16.2.10**, React **19.2.4**, react-dom **19.2.4**,
Tailwind **4.3.2**, TypeScript **5.9.3**, pnpm. Repo: `/home/nero/Clients/growthjourneytherapy`.
Blog = local Markdown + locally-hosted images. No CMS, no auth. Contact form = Resend.
Hosting is out of scope.

---

## 0. URGENT — CONTAINMENT FIRST (do this before writing a line of Next.js)

The security verifier is explicit: **the single largest risk to this project is treating it as a
website rebuild while the live site stays compromised.** The new site launches on the **same
domain**, so the domain's search reputation and malware flags follow it to Next.js. Two facts make
this time-critical:

- The attacker **still has write access**: newest spam post was dated **today** (id 234527,
  2026-07-09T16:09). Deleting spam without closing the entry vector = it repopulates within hours.
- Sucuri already flags the site with live visitor-facing malware (`fake_captcha.15.2`, a script from
  `trainer71245.icu` injected on the homepage and several pages — a fake-CAPTCHA / ClickFix lure that
  attacks *visitors*, not just SEO). Google Safe Browsing is **not yet** flagging the domain — that
  window is open but closing.

**Make "GSC shows spam de-indexed + no manual action + 48h with no new spam" a hard LAUNCH GATE.**
This is incident response on the *existing* site, not a hosting recommendation.

### Ordered containment steps (sequence matters — creds/backdoor BEFORE deleting posts)

1. **Close all access.** Rotate every credential: all WP admin passwords **and force-logout all
   sessions**; **revoke ALL WordPress Application Passwords**; the DB password (then update
   `wp-config.php`); cPanel/hosting login; every FTP/SFTP account; the Cloudflare account password
   **and enable Cloudflare 2FA**. Audit for rogue admins (`wp user list --role=administrator`) and
   rogue `~/.ssh/authorized_keys` entries. Rotation alone is incomplete because a backdoor survives
   it — hence step 2.
2. **Kill persistence.** Deactivate unknown plugins; inspect `wp-content/mu-plugins/`; `find uploads
   -name '*.php'` (must be empty); inspect `wp_options` `active_plugins` and the `cron` option;
   **audit the Code Snippets plugin** (the `code-snippets/v1` REST namespace is live on the box — a
   classic DB-resident-PHP persistence vector); disable XML-RPC and REST write. **Honest budget
   call:** if the therapist is not technical, this one step justifies a **one-time** professional
   incident cleanup (~$200–300, Wordfence/Sucuri) — a one-off, **not** a $500/mo subscription.
3. **Stop the bleed to Google** (near-zero effort, already on Cloudflare free tier). *After* access is
   closed: delete the spam bucket — `wp post delete $(wp post list --cat=1 --post_type=post
   --format=ids) --force` and the same for spam cats 21–32 — then regenerate the Yoast sitemap. Serve
   **HTTP 410** (not 404 — 410 de-indexes faster) for the spam URL shape via a Cloudflare free
   Redirect/WAF rule. **Do NOT blanket-noindex the whole site** — that kills her legit local SEO too.
4. **Search Console.** Remove any rogue verified owners (attackers add themselves), delete
   attacker-submitted sitemaps, resubmit the clean sitemap, and file a reconsideration request if a
   manual action exists. This is where reputation actually recovers.
5. **Verify.** Re-check `x-wp-total` after 48h to confirm no new spam (proves access is closed).

> Extraction of her content (Sections 1–2) can run in parallel with containment, but **pull her
> content BEFORE deleting anything**, and treat the live server as enemy territory (OUT-SSH-GUIDE.md §9).

---

## 1. Recovery strategy — ranked source-of-truth order

**Verifier ruling (security + extraction verifiers, both override the forensics recon agent):** the
9.7 GB backups are the *last* resort, not the first. They are **not on this machine and cannot fit**
(5.2 GB free vs 9.7 GB each — a 4+ GB shortfall before extraction even starts), both are compromised,
and the live REST API already returns her content cleanly and for free.

| Rank | Source | Covers | Why |
|---|---|---|---|
| **1** | **Live WordPress REST API** (`/wp-json`) | The **18** current English posts (ids 740, 230978–230984, 231113–231319) + all **35 pages** + her real images | Freshest copy, free, already pulled to `scratchpad/alt-sources/*.txt`. Cleanest discriminator is **category**, not ID (see §1.1). |
| **2** | **Wayback Machine** (`id_` snapshots + two `/feed/` captures) | The **11** deleted-but-archived posts, incl. **all Spanish content** (Wayback-only) and 6 English Gen2 essays | External ground truth the attacker cannot rewrite; the **only** surviving source for every Spanish post and the 2023 originals. |
| **3** | **cPanel `.tar.gz` backup** (preferred over `.wpress`) | Fallback for the **49 title-only** Gen2 posts and **2 partial** bodies — *only if the client wants that bulk-SEO cohort back* | Standard tar+raw SQL, produced by root-level `pkgacct` outside WordPress. **Must be processed on the server** (can't fit locally). See OUT-SSH-GUIDE.md + `cpanel-extract.md`. |
| **4** | **`.wpress` backup** | Same as #3, deeper fallback | Proprietary format, SQL has SERVMASK placeholder tokens, generated by PHP *inside* the hacked site. Use `wpress_extract.py` **on the server** only if the cPanel dump is corrupt. |

**Reasoning for the order:** (a) the live API is current, free, and already retrieved; (b) Wayback is
tamper-proof and the sole Spanish source; (c) the backups are huge, compromised, physically won't fit
locally, and mostly hold bulk-generated SEO content the owner *chose to delete* in her 2025 rebuild.
Both backups are "compromised in different ways" (different capture dates → different spam
generations); neither is ever restored or imported — evidence-bag only.

### 1.1 Spam discriminator (VERIFIER-CORRECTED — this overrides ground truth and two recon agents)

- **Post-ID rule (current DB):** `id ≤ 231319` → hers; `id ≥ 231510` → spam. **Nothing exists
  between.** First spam post is **id 231510** (`intriguiushhie-prikliuceniia-i-ogromnye-vyplaty`,
  created 2026-06-29T15:07:14). → Ground truth's "spam ≥ 234527" was ~3000 ids off; two recon agents'
  "231556" missed 4 spam posts. **Hack onset = 2026-06-29 ~15:07 UTC.**
- **Category rule (cleaner, use this for the live pull):** legit = **16 Family Life, 17 Stress, 18
  Self Identity, 19 Philadelphia**. Spam = **1 Uncategorized (965)** + spammer cats **21–32** (64).
  Counts 16=1, 17=8, 18=7, 19=2 sum to exactly **18** = the entire legit set. *Correction to the
  security verifier:* `?categories_exclude=1` returns **82**, which still includes the 64 spam posts
  in cats 21–32 — do **not** use it. Use **`?categories=16,17,18,19`** (→ exactly 18) or the explicit
  ID list.
- **Do NOT trust `post_date`** (spam backdates as far as 2025-08-16). Use `post_modified` (spam ≥
  2026-06-29) or category/ID.
- **The old "?p=1222–2004 = her post ids" hypothesis is REFUTED** (verifier fetched them: those are
  Gen2 *pages* — Privacy 1222, Terms 1225, Methods 1948, etc., all 404 now). A *pre-2025* backup would
  instead have post ids in the **~3253–3573** range; the current DB uses the 231319/231510 boundary.

Full authoritative post table, commands, and image-fetch recipes: **OUT-POST-RECOVERY.md**.

---

## 2. How many posts, and confidence

- **Real posts the owner ever published: 80** (Gen1 2023: 7 · Gen2 2024 cohort: 63 · Gen3 2026: 10). *high confidence.*
- **Full text recoverable now: 29** (18 live + 11 Wayback) → **27 unique articles** after dropping 2 near-duplicates. *high.*
- **Partial (title + verified teaser, body only in backups): 2** (the EN/ES "school-meetings" pair). *high.*
- **Body lost outside the two backups: 49** (bulk-SEO Gen2 cohort the owner deleted in 2025). *high that they existed; bodies unrecoverable without a pre-2025 backup.*
- **Excluded as theme-demo/default: 15** (hello-world ×2 + 13 posts dated 2018–2020).

**Recommendation:** ship the **27 unique** articles. The 49 title-only posts are low-value
bulk-generated SEO content she already abandoned — recover them only on explicit client request.

---

## 3. Next.js 16 architecture

### 3.1 Bilingual routing decision — route groups `(en)` / `(es)` with literal localized slugs

Rejected: the docs' `app/[lang]` i18n pattern (forces a `/en/` `/es/` prefix on every URL, destroying
her existing `/contacto`, `/category/psicologia` slugs) and any Accept-Language auto-redirect (bad for
bilingual SEO — Google crawls cookieless). **Chosen:** two route groups, each with its own root
layout, giving correct `<html lang>` per section with zero runtime machinery, preserving her exact old
slugs. Caveat (route-groups.md): two groups may **not** both resolve `/blog/[slug]`, so EN posts live
at `/blog/[slug]` and ES posts at `/es/blog/[slug]`; old dated permalinks 301 to those anyway.

### 3.2 Directory tree

```
growthjourneytherapy/
├── app/
│   ├── globals.css                 # Tailwind v4: @import "tailwindcss"; @theme inline; @plugin "@tailwindcss/typography"
│   ├── sitemap.ts                  # both languages, from the content index (keep it static)
│   ├── robots.ts
│   ├── opengraph-image.png(+.alt.txt)
│   ├── (en)/                       # root layout → <html lang="en">, imports globals.css, applies font vars
│   │   ├── layout.tsx
│   │   ├── page.tsx                # /  (home MUST live in a group — see §3.6)
│   │   ├── about-growth-journey-therapy/…  about-me/  get-started/  careers/
│   │   ├── contact/page.tsx        # Resend Server Action form
│   │   ├── faq/page.tsx            # /faqs, /frequently-asked-questions → 301 here
│   │   ├── good-faith-estimate/  image-and-video-rights/  cookie-policy/   # compliance (§6)
│   │   ├── groups/{page.tsx,[group]/page.tsx}
│   │   ├── category/psychology/page.tsx
│   │   └── blog/{page.tsx,[slug]/{page.tsx,opengraph-image.tsx}}
│   └── (es)/                       # root layout → <html lang="es">
│       ├── layout.tsx
│       ├── contacto/page.tsx       # exact old ES slug preserved
│       ├── category/psicologia/page.tsx
│       └── es/blog/{page.tsx,[slug]/{page.tsx,opengraph-image.tsx}}
├── content/blog/{en,es}/*.md       # authored Markdown + frontmatter
├── content/blog/images/…           # NOT public/ — enables dynamic-import() auto width/height/blur (§3.4)
├── content/redirects/legacy.json   # old-URL → new-URL map (≈60–100 real entries)
├── lib/{content.ts,markdown.ts,site.ts}
├── components/{PostImage.tsx,LanguageSwitcher.tsx,ContactForm.tsx,…}
├── proxy.ts                        # NOT middleware.ts (§4 corrections) — 410 spam URLs
└── next.config.ts                  # redirects() imports legacy.json
```

### 3.3 Markdown pipeline — parse ourselves (gray-matter + unified), NOT @next/mdx

`@next/mdx` **does not support frontmatter** (mdx.md:622) and needs a mandatory `mdx-components.tsx`.
We need a frontmatter-driven content index anyway (for listings, `generateStaticParams`, hreflang
pairs, sitemap, redirect map), so: `fs` + `gray-matter` for the index; body rendered with
`unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeSlug)` → `rehype-react`
mapping `<img>` → our `<PostImage>` server component. **Never `dangerouslySetInnerHTML`** recovered
content (stored-XSS risk). Add deps: `gray-matter unified remark-parse remark-gfm remark-rehype
rehype-slug rehype-react @tailwindcss/typography`.

### 3.4 Frontmatter schema

```yaml
---
title: "What Is Cultural Deprivation?"
lang: en                          # en | es
slug: what-is-cultural-deprivation
translationSlug: que-es-la-deprivacion-cultural   # shared pair → hreflang; omit if none
date: 2023-05-03                  # TRUE original publish date (see §note on Gen2 dates)
category: psychology              # psychology|psicologia|family-life|stress|self-identity|philadelphia
description: "…"                  # preserve the exact Yoast meta description Google already indexed
image: cultural-deprivation.jpg   # file in content/blog/images/
draft: true                       # owner-review gate before publish
legacyUrls:                       # feeds the redirect map
  - /2023/05/03/what-is-cultural-deprivation/
---
```

> **Date note (verifier):** the 8 Gen2 survivors carry a live `post_date` of 2024-10-11 (a reimport
> artifact). Their **true** publish dates are 2024-01-11 → 2024-03-12 (from `article:published_time`
> in Wayback). Use the true dates in frontmatter. The 2026 posts' dates are real.

### 3.5 Image handling

Blog images go in **`content/blog/images/`**, not `public/`, and render via the documented
**dynamic-`import()`** pattern (12-images.md) which yields automatic `width`, `height`, and
`blurDataURL` — no manual dimensions, zero CLS:

```tsx
// components/PostImage.tsx (Server Component)
import Image from 'next/image'
export async function PostImage({ file, alt }: { file: string; alt: string }) {
  const { default: img } = await import(`@/content/blog/images/${file}`)   // static prefix required
  return <Image src={img} alt={alt} sizes="(max-width: 768px) 100vw, 720px" />
}
```

> **Cross-agent conflict resolved (verifier):** the markdown-pipeline recon agent wrote images to
> `public/images/blog/<slug>/` and rewrote `<img src>` to `/images/...`. Public-folder **string** srcs
> get **no** automatic dimensions under Next 16. **Emit into `content/blog/images/`** and have the
> pipeline rewrite `<img>` to bare filenames the `PostImage` component resolves.

### 3.6 Redirect strategy for ~1000 legacy URLs

Only **~60–100** legacy URLs are her real content; the other **~965 are spam** and must NOT be
redirected. Layered design:

1. **`content/redirects/legacy.json`** (~60–100 entries: dated permalinks, `/faqs`→`/faq`, old
   Spanish page slugs) imported by `next.config.ts` `async redirects()`. `permanent: true` emits
   **308**. Well under the 1,024 platform cap; `redirects()` runs **before** Proxy.
2. **`proxy.ts`** returns a bare **410 Gone** for spam shapes (percent-encoded Cyrillic paths, `/2026/`
   dated posts, `/category/uncategorized/…`) so Google de-indexes them fast. One regex; Node runtime;
   matcher scoped off `/_next/*`.
3. Unknown blog slugs 404 via `export const dynamicParams = false` + `not-found.tsx`.

> **Gotcha (verifier):** with two root layouts and no top-level `app/layout.tsx` there is **no global
> 404** for URLs matching no route — exactly where missed spam URLs land. `global-not-found.js` exists
> for this (not-found.md:58/65) but is **experimental** (`experimental.globalNotFound: true`). Decide
> at build time: enable it, add a catch-all `[...rest]`, or make the proxy 410 regex exhaustive.

---

## 4. Corrections to assumed APIs (Next 16 / React 19 / Tailwind 4) — THE GOLD TABLE

Every "actual" was verified against the installed packages / local docs. Paths are relative to the
repo; docs live under `node_modules/next/dist/docs/01-app/`.

| # | Training-data assumption | Actual in this stack | Proof (verified this session) |
|---|---|---|---|
| 1 | `middleware.ts`, `export function middleware` | **`proxy.ts`, `export function proxy`.** Edge runtime **not supported**; Node only, not configurable. `skipMiddlewareUrlNormalize`→`skipProxyUrlNormalize` | `…/03-file-conventions/proxy.md:11`; `…/upgrading/version-16.md:774` |
| 2 | `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` are sync (or sync-with-warning) | **Promises; synchronous access FULLY REMOVED.** Must `await`. | `version-16.md:298` "synchronous access is fully removed"; `page.md` (params typed `Promise`) |
| 3 | Hand-write `{ params: Promise<{slug:string}> }` prop types | **`PageProps<'/blog/[slug]'>` / `LayoutProps<'/'>`** globally available, no import (from `next typegen`) | `…/03-file-conventions/page.md` "Page Props Helper" |
| 4 | `opengraph-image`/`icon` get sync `params`/`id` | **`params` AND `id` are Promises** in the image fn. (`generateImageMetadata` params stay **sync**.) | `version-16.md` "Async parameters for icon, and open-graph Image" |
| 5 | `sitemap` `generateSitemaps` `id` is a number | **`id` is `Promise<string>`** (`Number(await id)`) | `version-16.md` "Async id parameter for sitemap" |
| 6 | `webpack` key in `next.config`; add `--turbopack` to opt in | **Turbopack is default for dev AND build; a `webpack` key FAILS the build.** Loader config is top-level `turbopack`, not `experimental.turbopack` | `version-16.md` "Turbopack by default" |
| 7 | `experimental.ppr`; `revalidateTag('posts')` | **PPR flag gone → `cacheComponents` (opt-in).** `'use cache'`/`cacheLife`/`cacheTag` require `cacheComponents:true`, which **removes** `dynamicParams`/`dynamic`/`revalidate` segment config. `revalidateTag` needs a 2nd arg. **Leave `cacheComponents` OFF** for this static blog. | `version-16.md` "Caching APIs"; `…/route-segment-config/dynamicParams.md:22` |
| 8 | `next/image`: quality 75 default but any value ok; `images.domains`; 60s cache | **`images.qualities` defaults to `[75]` only (others coerced/400);** `minimumCacheTTL` 60s→**4h**; `16` removed from `imageSizes`; **`images.domains` deprecated** → `remotePatterns`; query-string srcs need `localPatterns.search`; `maximumRedirects` 3; local-IP optimization blocked; `next/legacy/image` deprecated | `version-16.md` "next/image changes" |
| 9 | `/public` string `src` needs manual `width`/`height`; markdown images awkward | **Dynamic `import()` in a Server Component** gives automatic `width`/`height`/`blurDataURL` for content images; keep them in `content/blog/images/` (static prefix), not `public/` | `…/01-getting-started/12-images.md` "Images without static imports" |
| 10 | `next.config` `i18n: { locales, defaultLocale }` | **No `i18n` key exists for App Router** (Pages-only). Use route groups. | no `i18n.md` in `…/05-config/01-next-config-js/`; `…/internationalization.md` |
| 11 | `useFormState` from `react-dom` | **`useActionState` from `react`**; `useFormStatus` from `react-dom`. `useFormState` is a deprecated alias — do not use. | grep of installed `react`/`react-dom` 19.2.4 cjs bundles; `…/forms.md` |
| 12 | zod `invalid_type_error` (as shown in local `forms.md`) | **zod v4**: use `error` param; `z.email()` is top-level. **The Next docs example lags zod v4** — copying it verbatim breaks. | `forms.md:143` (v3 syntax) vs installed zod v4 |
| 13 | `@next/mdx` handles frontmatter | **It does not** — parse frontmatter yourself (gray-matter) | `…/02-guides/mdx.md:622` |
| 14 | `next lint` in CI | **Removed in 16.** Repo already uses `"lint": "eslint"` (flat config) | `version-16.md` "Removals"; `package.json` |
| 15 | Any Node 18 / older TS is fine | **Node ≥ 20.9, TypeScript ≥ 5.1 required** (repo TS 5.9.3 ok) | `version-16.md` (top) |
| 16 | `tailwind.config.js` + `@tailwind base/components/utilities` | **Tailwind v4 is CSS-first: no config file.** `@import "tailwindcss"` + `@theme inline` in `globals.css`; load plugins via **`@plugin "@tailwindcss/typography";`**. Repo confirms: no `tailwind.config.*`, `postcss.config.mjs` uses `@tailwindcss/postcss` | repo `app/globals.css`, `postcss.config.mjs`; tailwindcss 4.3.2 |
| 17 | A single `app/layout.tsx` global 404 catches unknown URLs | **Two root layouts ⇒ no global 404.** `global-not-found.js` is **experimental** (`experimental.globalNotFound:true`) | `…/03-file-conventions/not-found.md:58,65` |
| 18 | `redirects()` `permanent:true` semantics unclear | `permanent:true` = **308**; `async redirects()` supported; 1,024-entry platform cap → use Proxy map for 1000+ | `…/02-guides/redirecting.md` |

**Restructuring cost nobody flagged in recon (verifier):** the current single `app/layout.tsx` defines
`Geist`/`Geist_Mono` font CSS variables that `app/globals.css` consumes via `@theme inline`
(`--font-geist-sans`, `--font-geist-mono`). Splitting into `(en)`/`(es)` root layouts means deleting
`app/layout.tsx`, moving `app/page.tsx` into a group (home must live in a group), and having **both**
new root layouts import `globals.css` and apply the font-variable classNames — otherwise Tailwind
`font-sans`/`font-mono` silently resolve to nothing. (Swap Geist → a Latin-subset face like Inter that
covers Spanish diacritics if the brand allows.)

---

## 5. Resend contact form + PHI/BAA call

**PHI/BAA ruling (security verifier CONFIRMS the recon agent): Resend does NOT sign a BAA and is not
HIPAA-eligible** (its security page states verbatim "Resend has not started pursuing HIPAA or ISO 27001
certifications"; only SOC 2 + GDPR). **No PHI may transit Resend.** A therapy-site contact form
identifies the submitter as seeking mental-health care, so even name+email is sensitive. **The
PHI-minimal design is defensible**, with the therapist's written residual-risk sign-off as the control.

**Design:**
- **Transport:** a **Server Action** (per local `forms.md`), not a Route Handler. `useActionState`
  from `react`, `useFormStatus` from `react-dom`, zod **v4** `safeParse`.
- **Fields ONLY:** name, email, phone (optional), preferred contact time, consent checkbox, hidden
  locale. **NO free-text "what brings you here" textarea** — that is the load-bearing mitigation; a
  warning label above a textarea does not work. Every free-text box on a therapist's site becomes a
  symptom description within a week.
- **Clinical intake** routes out to a **BAA-covered** system — link her **existing SimplePractice
  client portal** (do not provision new paid tooling; Hushmail for Healthcare ~$12/mo only if she has
  no EHR).
- **Spam:** Cloudflare **Turnstile** (managed mode — invisible, no Google tracking, domain already on
  Cloudflare) + honeypot + 3-second timing gate; verify the token server-side before calling Resend.
- **Send:** one `resend.batch.send([...])` call — owner notification (`replyTo` = prospect) + a
  **content-free** bilingual confirmation to the prospect from
  `hello@send.growthjourneytherapy.com` (`replyTo` = practice mailbox), `react` + `text` parts,
  tracking off. The confirmation must never echo form contents (its mere presence in an inbox reveals
  the person contacted a therapist).
- **DNS:** verify subdomain `send.growthjourneytherapy.com` in Resend (SPF TXT, DKIM TXT, feedback MX,
  all **gray-cloud** in Cloudflare, host entered as bare `send`); DMARC TXT at apex, start `p=none`
  then `p=quarantine`. **Never touch the apex MX** (her real mailbox).
- Env: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `PRACTICE_INBOX`,
  `SECURE_INTAKE_URL`. Install: `pnpm add resend @react-email/components zod`
  (resend@6.17.2, @react-email/components@1.0.12, zod v4).

### 5.1 Disclaimer copy (render ABOVE the fields) — verbatim

**English**
> **Please do not include any medical or mental-health information in this form.** This form is only
> for requesting an appointment or asking a general question, and it is not an encrypted medical
> communication. Once we connect, we'll share any clinical information through a secure,
> HIPAA-compliant system. **If you are in crisis or experiencing a mental-health emergency, call or
> text 988 (Suicide & Crisis Lifeline) or call 911 — do not use this form.**

**Spanish**
> **Por favor, no incluya información médica ni de salud mental en este formulario.** Este formulario
> es únicamente para solicitar una cita o hacer una pregunta general, y no es un medio de comunicación
> médica cifrado. Una vez que estemos en contacto, compartiremos cualquier información clínica a través
> de un sistema seguro que cumple con HIPAA. **Si está en crisis o atraviesa una emergencia de salud
> mental, llame o envíe un mensaje de texto al 988 (Línea de Prevención del Suicidio y Crisis —
> atención disponible en español) o llame al 911; no use este formulario.**

Full code (schema, action, form, email templates): `scratchpad/resend-contact.md`.

---

## 6. Compliance pages that MUST survive the migration

**Must carry over (verified still legally required in 2026):**
- **`/good-faith-estimate/`** — No Surprises Act; required for self-pay/uninsured clients, federal, has penalties.
- **`/image-and-video-rights/`**
- **`/cookie-policy/`**
- Any existing **Privacy Policy** page.

**Security review flags these as likely-missing — confirm with the therapist and add if absent:**
Privacy Policy, **Notice of Privacy Practices (NPP)**, **telehealth informed-consent**, and an
**accessibility statement**. These are compliance content, not scope creep.

**Preserve the exact old URLs** for all of the above (redirect map in §3.6). Also preserve her real
public pages seen live: home, about-me/about-growth-journey-therapy, team, mission, specialties (+
subpages), methods (+ 14 therapy subpages), FAQ, careers, community-resources, insurance-and-payment,
schedule-now, contact/contacto, blog, groups + 4 group subpages. Pull page content from
`/wp-json/wp/v2/pages` (35 pages, all hers; **note the Home page id 83 body was defaced today — strip
everything from the first `position:absolute; top:-9999px` anchor onward**).

---

## 7. Phased execution plan

**Phase 0 — Containment (LAUNCH GATE, do first; can overlap Phase 1 extraction).** Steps in §0.
Pull her content *before* deleting spam.

**Phase 1 — Extract content (today/tomorrow).**
1. Live posts: `?categories=16,17,18,19` → 18 posts (already in `scratchpad/alt-sources/*.txt`).
   Strip Divi `[et_pb_*]` shortcodes; fix id 231152's slug to
   `sourcing-calm-from-the-outdoors-how-nature-helps-regulate-a-stressed-nervous-system`.
2. Live pages: `/wp-json/wp/v2/pages?per_page=100` → 35 pages; strip the Home (id 83) injection.
3. Wayback: fetch the 11 archive-only posts via `id_` snapshots + the two `/feed/` captures (all
   Spanish content lives here only). Commands in OUT-POST-RECOVERY.md.
4. Images: pull her originals from live `/wp-json/wp/v2/media` (exclude date ≥ 2026-06-29, drop id
   233676); Wayback `im_` as fallback. Fits easily (≈182 images, ~0.2–0.5 GB).
5. (Optional) If the client wants the 49 title-only Gen2 posts, extract them from a backup **on the
   Bluehost server** (OUT-SSH-GUIDE.md + `cpanel-extract.md`) — never download the 9.7 GB archive locally.

**Phase 2 — Sanitize + convert.** Per `wp-to-md-pipeline.md`: extract `article .entry-content` (or feed
`content:encoded`), strip hidden-div/spam-anchor cloaks on the RAW HTML, allowlist-sanitize (nh3),
`pandoc -f html -t gfm-raw_html --wrap=none`, write `content/blog/<lang>/<slug>.md` with the §3.4
frontmatter (`draft: true`). Re-encode every image (strips polyglot payloads/EXIF); verify magic bytes.
Text-diff each post against its Wayback capture to catch tampering.

**Phase 3 — Scaffold Next 16.** Split `app/layout.tsx` into `(en)`/`(es)` root layouts (both import
`globals.css` + apply font vars); move `page.tsx` into `(en)`; add `@plugin "@tailwindcss/typography"`;
build `lib/content.ts` (fs + gray-matter index), `lib/markdown.ts` (unified pipeline), `PostImage`.
Set `typedRoutes: true` (now stable — cheap insurance for a bilingual literal-slug matrix).

**Phase 4 — Pages, blog routes, SEO.** Port pages as authored components; `blog/[slug]` +
`es/blog/[slug]` with `generateStaticParams` + `dynamicParams = false`; `generateMetadata` with
`metadataBase` + `alternates.canonical`/`languages`; per-post `opengraph-image.tsx` (params is a
Promise); `sitemap.ts` + `robots.ts` (keep static — no `headers()/cookies()`).

**Phase 5 — Redirects + spam suppression.** Generate `content/redirects/legacy.json` from Wayback +
frontmatter `legacyUrls`; wire `next.config.ts` `redirects()` (308); `proxy.ts` 410 for spam shapes;
decide the global-404 approach (§3.6 gotcha).

**Phase 6 — Contact form.** §5. Get the therapist's written residual-risk sign-off; wire Turnstile +
Resend `send.` subdomain DNS.

**Phase 7 — Launch gate.** Verify GSC: spam de-indexed, no manual action, 48h with no new spam. Then
cut DNS. Submit the clean sitemap; request re-indexing of the 27 recovered posts + real pages.

---

## 8. Open questions for the developer

1. **Do the two backups predate the 2025 Divi rebuild?** If either is pre-2025, its `wp_posts` uses
   the ~3253–3573 ID range and may hold the **49 lost Gen2 bodies** + the 2 partial Spanish posts. If
   both are post-rebuild, those 49 are gone. Date them on the server first (filename + newest uploads
   mtime + max post id in the dump).
2. **Does the client actually want the 49 bulk-SEO Gen2 posts back**, or is the 27-article corpus
   enough? Drives whether we touch the backups at all.
3. **Does she use SimplePractice (or another EHR with a client portal)?** Needed for the contact
   form's clinical-intake link. If not, provision Hushmail for Healthcare.
4. **Will she sign the written residual-risk acknowledgment** that name+email+phone transit Resend
   (non-BAA)? If she wants zero identifiable data through Resend, the form must be replaced by a
   BAA-covered intake link entirely.
5. **Global-404 strategy** for missed spam URLs: enable `experimental.globalNotFound`, add a catch-all
   route, or exhaustive proxy regex? (§3.6)
6. **cPanel Terminal availability** — if `cPanel > Advanced > Terminal` exists, the entire SSH setup can
   be skipped for the DB work (OUT-SSH-GUIDE.md §8.1).
7. **Actual `uploads/` size and DB table prefix** — determines rsync strategy and every SQL command
   (prefix may not be `wp_`).
8. **Brand/design direction** for the rebuild (fonts, palette, whether to keep Geist) — not covered by
   recon; needs the client.
