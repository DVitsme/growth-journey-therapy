# Domain reputation cleanup — execute AT LAUNCH, not before

The domain (`growthjourneytherapy.com`) carries ~1,029 indexed spam URLs from the hack. Because the
domain moves to Cloudflare/Next.js but stays the same domain, that reputation follows it. This is the
plan to clean it — sequenced correctly.

## Why this is a launch task, not a now task

Google only drops a spam URL when it re-crawls it and gets a "gone" signal (410/404). That signal has
to be **live on whatever is serving the domain when Google next crawls** — which will be the new
Next.js site. Running the GSC Removals tool or submitting a clean sitemap while the old hacked WP is
still returning `200 OK` for spam accomplishes nothing: Google re-crawls, still sees spam, cleanup
reverts. So the order is fixed:

**build new site (with the 410 handler) → deploy → cut DNS to Cloudflare → THEN do the GSC steps below.**

## Assets already prepared (in this folder)

| File | What it is | Consumed by |
|---|---|---|
| `spam-urls.txt` | All 1,029 spam post URLs (authoritative, from the live DB) | GSC Removals; 410 handler test |
| `spam-taxonomy-urls.txt` | 13 spam category/author archive URLs | GSC Removals; 410 handler |
| `her-legacy-posts.json` | Her 18 real posts' old dated permalinks → slug | the 301 redirect map |

Spam discriminator: post ID ≥ 231510 (hers are ≤ 231319). Old permalink structure was
`/%year%/%monthnum%/%day%/%postname%/`. Her real dates are `/2024/10/`, `/2026/03/`, `/2026/04/`;
spam dates are `/2025/08/`, `/2026/05/`, `/2026/06/`, `/2026/07/` — **no overlap**.

## Step 1 — Ship the 410 + 301 handler with the new site

The new site does not use dated permalinks, so **any `/YYYY/MM/DD/...` request is a legacy URL**: her
18 get a 301 to their new home, everything else on that pattern gets a 410. This one rule cleans the
whole spam set without fragile keyword matching. In Next 16 this goes in **`proxy.ts`** (the renamed
`middleware.ts` — `export function proxy`, Node runtime). Reference implementation:

```ts
// proxy.ts  (project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import legacy from './docs/seo/her-legacy-posts.json'

// old dated permalink -> new slug (finalize the /blog/... target to match the real route structure)
const REDIRECTS = new Map(legacy.map((p: {oldPath: string; slug: string}) => [p.oldPath.replace(/\/$/, ''), p.slug]))

const DATED = /^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/           // any old post permalink
const SPAM_TAX = /^\/(category|author)\/[^/]+\/?$/i          // legacy taxonomy archives (new site has none)

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname.replace(/\/$/, '') || '/'

  const slug = REDIRECTS.get(path)
  if (slug) return NextResponse.redirect(new URL(`/blog/${slug}`, req.url), 301) // 308 if you prefer

  if (DATED.test(req.nextUrl.pathname) || SPAM_TAX.test(req.nextUrl.pathname)) {
    return new NextResponse('410 Gone', { status: 410, headers: { 'x-robots-tag': 'noindex' } })
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/|api/|images/|favicon).*)'] }
```

Notes:
- Confirm the `/blog/<slug>` target against the final routing decision in `../MIGRATION-PLAN.md`
  (the two Spanish posts and the one malformed slug `https-growthjourneytherapy-com-...` are in
  `her-legacy-posts.json`; the malformed one's clean slug is `sourcing-calm-from-the-outdoors-...`).
- Do **not** 301 spam URLs to the homepage — that's a soft-404 Google penalizes. 410 is correct.
- After deploy, spot-check: `curl -sI https://growthjourneytherapy.com/<a-spam-url>` → `410`;
  `curl -sI https://growthjourneytherapy.com/2024/10/11/<her-slug>/` → `301`.

## Step 2 — Serve a clean sitemap + robots (new site)

- `app/sitemap.ts` lists ONLY her real URLs (18 posts + 35 pages). Never the spam.
- `robots.ts` allows all and points to the new sitemap. (The old Yoast `sitemap_index.xml` and its
  `post-sitemap*.xml` children die with WordPress — good.)

## Step 3 — Google Search Console (owner-only; after DNS cutover)

Requires the Google account that owns/can verify the property. Do these once the new site is live and
returning 410s:

1. **Verify the property** (DNS TXT via Cloudflare, or the domain property if already verified).
2. **Removals → New Request → "Remove all URLs with this prefix"** where a prefix is shared; for the
   scattered spam, submit the top offenders from `spam-urls.txt` (Removals is a fast temporary hide,
   ~6 months — the 410s make it permanent). Prioritize anything still showing in a
   `site:growthjourneytherapy.com` search.
3. **Sitemaps → remove the old `sitemap_index.xml`**, submit the new `sitemap.xml`.
4. **Pages report:** watch the spam URLs move to "Crawled – not indexed" / "Not found (410)" over the
   following days/weeks. This is normal and is the cleanup working.
5. **Security & Manual actions tabs:** if either flags a hacked-site issue, click **Request review**
   only *after* 410s are live and spam is dropping — describe the remediation (compromise removed,
   site rebuilt clean, spam returning 410).

## Step 4 — Reinforce (optional, high value for a therapy practice)

- Check **Google Safe Browsing** status (Transparency Report) for the domain; if flagged, the Search
  Console review request covers it.
- Because contact + client email will send from this domain via Resend, confirm the domain isn't on
  email blocklists once the hacked host is off (a compromised WP is a common spam-sending source).

## What does NOT need doing

Per the decision to shut down Bluehost after cutover: no WordPress hardening, no plugin cleanup, no
permanent removal of the malware there. The malware never enters the Next.js build (rebuilt from clean
recovered content), and the box is discarded. The only durable work is the domain-side cleanup above.
