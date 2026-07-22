# SEO redirect / 410 layer — implementation

Post-WordPress-recovery redirect layer for growthjourneytherapy.com. **Built 2026‑07‑22.**

## ⚠️ Why NOT `proxy.ts` (overturns the earlier plan)

The original plan (CLAUDE.md, `DOMAIN-REPUTATION-RUNBOOK.md`, `MIGRATION-PLAN.md` §3.6) was a single
Next 16 `proxy.ts`. **That cannot deploy on this stack** — verified empirically, not just from docs:

- A Next 16 `proxy.ts` is **always** Node-runtime middleware (`get-page-static-info.js` throws if you
  try to set a runtime; `build/index.js` writes it as `functions['/_middleware'] = { runtime: 'nodejs' }`).
- **`@opennextjs/cloudflare@1.20.1` hard-rejects Node middleware** — `dist/cli/build/build.js:66-68`:
  `if (useNodeMiddleware(options)) { logger.error("Node.js middleware is not currently supported…"); process.exit(1) }`.
- **Proof:** adding a minimal `proxy.ts` and running `pnpm exec opennextjs-cloudflare build` → exit 1
  with `ERROR Node.js middleware is not currently supported.`

A deprecated edge `middleware.ts` *would* deploy, but we deliberately avoid a deprecated convention on
a Next‑16 codebase. Instead we use **stable, current Next config primitives** — which are also the
Next‑recommended home for redirects.

## Architecture

| Need | Where | Notes |
|---|---|---|
| ~20 legacy dated permalinks + 2 dup slugs → **301** | `next.config.ts` `redirects()` (`statusCode: 301`) | Data in generated `lib/legacy-redirects.ts`. |
| ~1,042 hacked-spam URLs → **410 Gone** | `next.config.ts` `rewrites()` (3 closed shapes) → `app/api/gone/route.ts` | Route handlers can emit any status; `redirects()` can't do 410. |

`redirects()` run **before** `rewrites()`, so a legit legacy dated URL 301s *before* the generic
dated-spam rule can 410 it. The three spam shapes — `/YYYY/MM/DD/*`, `/category/*`, `/author/*` — are
closed namespaces with **no** legitimate route on the new site (verified), so 410-by-shape is safe and
covers all 1,042 spam URLs (plus any variant Google indexed) without a runtime lookup table.

## Files

- `lib/legacy-redirects.ts` — **generated**, do not hand-edit. 21 `{source, destination}` entries.
- `next.config.ts` — `redirects()` (maps `LEGACY_REDIRECTS`) + `rewrites()` (spam shapes → `/api/gone`).
- `app/api/gone/route.ts` — returns `410 Gone` + `x-robots-tag: noindex`.
- Generator: `scratchpad/gen_redirects.py` (offline, gitignored) reads `docs/seo/her-legacy-posts.json`
  + `docs/seo/extra-redirects.txt`. Re-run it to regenerate the map. It fixes the one malformed slug
  (JSON id 231152: a full URL was pasted into the slug — corrected to
  `/blog/sourcing-calm-from-the-outdoors-…`, with both the mangled and clean source paths registered).

## Trailing-slash behaviour (by design)

All indexed WordPress URLs end in `/`. Next's `trailingSlash:false` normalization emits a **308** to
the no-slash form *before* custom redirects/rewrites run (confirmed: an explicit `/…/` source does not
beat it; only site-wide `skipTrailingSlashRedirect` would, which we reject to keep real-page
canonicalization). So indexed URLs resolve as a **two-hop chain**:

- legacy `…/slug/` → **308** → `…/slug` → **301** → `/blog/slug`
- spam `…/casino/` → **308** → `…/casino` → **410**

This is SEO-fine — Google follows chains, consolidates link equity, and de-indexes the 410. The
no-slash forms are single-hop (direct 301/410).

## Verified (2026‑07‑22)

`next build`+`next start` and `opennextjs-cloudflare build`+`wrangler dev` (real workerd):
legacy → 301 (target 200 on live prod for all checked), spam → 410, real pages (`/`, `/team`, blog) →
200, typecheck clean. (`wrangler dev` shows SSG targets as 404 — a local-only incremental-cache quirk;
live prod serves them 200.)

## Still authoritative for GSC

`docs/seo/spam-urls.txt` (1029) + `spam-taxonomy-urls.txt` (13) remain the list to submit to Google
Search Console **Removals** and to spot-check with `curl`. Fast de-indexing also requires the
crawl-block in `app/robots.ts` to be lifted at real launch (Google must re-crawl to see the 410s).
