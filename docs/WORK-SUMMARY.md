# Beyond the rebuild — everything delivered for growthjourneytherapy.com

> **Purpose:** source material for a client-facing update email. Captures the work done **beyond** a
> like-for-like recreation of the old site — i.e. the recovery, hardening, modernization, and
> improvements that aren't visible just by looking at the pages. Keep this updated as go-live items
> land. Written for the agency; distill into plain client language when composing the email.
>
> **Status legend:** ✅ done · 🟡 in progress / needs a step · 🔜 at launch. Last updated 2026-07-22.

---

## The one-paragraph story (for the top of the email)

The visible result is a website that looks like the practice's original site — but that's the small
part. The original site had been **hacked** and was actively serving casino-spam malware to visitors
and Google. We investigated the breach, stopped the live infection, safely separated the practice's
real content from ~1,000 injected spam pages, and rebuilt everything on a modern, secure, fast
platform that **removes the weaknesses that got the old site hacked in the first place** — while also
improving accessibility, search/SEO recovery, email reliability, and long-term maintainability.

## At a glance / by the numbers

- **1 active malware infection identified and stopped** (a casino-spam injector running on every page).
- **~1,029 spam posts / ~1,042 spam URLs** identified; now return **410 Gone** to get them removed from Google.
- **Real content recovered cleanly** — originally 18 posts + 35 pages buried among the spam; rebuilt as
  **30 blog posts** (28 EN + 2 ES), **13** therapy-method pages, **7** specialty pages, and **25** core pages.
- **7 clinicians** given individual profile pages, bylines, and search-engine structured data.
- **20 legacy URLs preserved** with permanent redirects so existing Google rankings and links aren't lost.
- **Full XML sitemap (78 pages)** generated for search engines, auto-kept in sync with the site's content.
- **DNS + email migrated with zero downtime** — Google Workspace (Gmail) and Resend kept working throughout.
- **~20 documentation files** produced (forensics, migration, architecture, SEO, DNS) for a clean handoff.

---

## 1. Security & incident response  ✅ (stopgap done; full teardown pending)

**What we did**
- Performed an authorized, read-only forensic investigation of the live Bluehost server (over SSH).
- Identified the compromise precisely: **database-resident SEO "doorway" spam** — a malicious *Code
  Snippets* plugin ("Analytics Configuration," 4 snippets) injecting a third-party script
  (`trainer71245.icu`) into **every page**, and minting ~1,029 casino/betting/crypto spam posts in a
  dozen languages. Also found **two rogue admin accounts** with live sessions.
- **Stopped the active, visitor-facing malware** (authorized, reversible stopgap): deactivated the
  malicious snippets, destroyed all sessions (kicking the attackers out), and purged caches.
- Confirmed what was **clean** (no SSH backdoor, no file-based webshells, her real content untouched)
  and documented the exact containment order and remaining entry-vector risks.
- Full record: `docs/INCIDENT-FINDINGS.md`, `docs/research/{hack-forensics,live-forensics}.md`.

**Why it matters (client language):** the site wasn't just outdated — it was compromised and damaging
the practice's reputation with Google and visitors. We found it, stopped it, and made sure none of the
malware carried into the new site.

**Status:** ✅ Active malware stopped; new site is built clean and malware-free. 🟡 Remaining:
fully decommission the old Bluehost/WordPress install and rotate all associated passwords (the old
malware is *deactivated, not yet removed* — tracked as a go-live task).

## 2. Platform modernization & hardening  ✅

**What we did**
- Rebuilt off **hacked WordPress + Divi** onto **Next.js 16 / React 19**, with content stored as plain
  files (Markdown/JSON) — **no database, no plugins, no admin login, no server-side CMS**.
- This removes essentially the entire attack surface that got the old site hacked: there is no WordPress
  to exploit, no plugin to inject code through, and no login to steal.

**Why it matters:** the new site *can't* be hacked the way the old one was — there's nothing there to
break into. It's also far simpler to maintain and can't be broken by a bad plugin update.

**Status:** ✅ Built and deployed.

## 3. Performance, hosting & reliability  ✅

**What we did**
- Deployed to **Cloudflare's global edge network (Workers)** via OpenNext — pages are pre-built and
  served from data centers close to each visitor.
- Static generation + automatic image optimization (modern AVIF/WebP formats) for fast loads.
- No traditional web server to patch, go down, or get overloaded.

**Why it matters:** the site is fast everywhere, highly reliable, and cheap to run — with no server
maintenance burden.

**Status:** ✅ Live on Cloudflare; the domain now serves from this platform.

## 4. Accessibility for the practice's actual audience  ✅

**What we did**
- Designed around the primary audience (older adults / lower-vision users): a larger, **accessible type
  scale** (19px body text — the GOV.UK / NHS standard), a 16px minimum, generous line spacing, and
  reading columns capped for comfortable line lengths.
- Zoom- and browser-resize-friendly typography; touch/click targets kept at the accessible ≥44px size.
- Decision record: `docs/ACCESSIBILITY-TYPE-SCALE.md`.

**Why it matters:** the site is genuinely easier to read and use for the people most likely to be
seeking this practice's help — not just visually faithful, but more usable than the original.

**Status:** ✅ Implemented site-wide.

## 5. Email deliverability & DNS migration  ✅ (migration done; two fixes queued)

**What we did**
- Migrated the domain's DNS from **Bluehost to Cloudflare with zero downtime** and, critically,
  **without interrupting the practice's Google Workspace Gmail** or its Resend (transactional) email.
- Verified every mail record by hand and recreated them exactly; **cleaned out a large pile of dead and
  hacker-era DNS records**; simplified the SPF record.
- **Found pre-existing email-authentication problems** the old setup had: a **DMARC record installed in
  the wrong place** (so it did nothing) and a **truncated/broken Google DKIM key**. Both are documented
  with a fix plan.
- Full record: `docs/DNS-MIGRATION.md`.

**Why it matters:** the practice's email kept working throughout a risky infrastructure change, and we
identified real deliverability issues (things that can quietly send legitimate email to spam) to fix.

**Status:** ✅ DNS + email cutover complete and verified. 🟡 Queued: turn on proper DMARC (via
Cloudflare's free dashboard tool — no report-email clutter) and optionally repair the Google DKIM key.

## 6. Search / SEO recovery & reputation cleanup  ✅ (redirects/410s + cleanup mode LIVE; full public launch pending)

**What we did**
- Added **permanent (301) redirects** from the practice's old blog URLs to the new ones, so existing
  Google rankings, backlinks, and bookmarks carry over instead of breaking.
- Made the **~1,042 hacked casino-spam URLs return "410 Gone,"** the signal that tells Google to remove
  them — actively cleaning up the domain's search reputation.
- Prepared a **domain-reputation runbook** and a full list of spam URLs for Google Search Console's
  removal tool. Files: `docs/seo/REDIRECTS.md`, `docs/seo/DOMAIN-REPUTATION-RUNBOOK.md`.
- Built a **complete XML sitemap** (`/sitemap.xml`, 78 pages — every blog post, therapist profile,
  service page, and core page, with real last-modified dates on posts) so search engines can discover
  and index the whole site efficiently. It's generated from the site's own content, so it stays accurate
  automatically as pages change. File: `app/sitemap.ts`.
- Set up a **safe, staged search-visibility gate** (`app/robots.ts`, one setting). Three modes —
  **blocked** (fully hidden), **cleanup** (Google may crawl to clear the spam, but the real pages carry a
  site-wide "noindex" so they stay out of results), and **live** (fully public). We turned on **cleanup
  mode**, so the casino-spam de-indexing is **actively running now** — weeks before the public launch —
  while the real pages stay private until sign-off. Launch = flip the one setting to "live."
- **AI-crawler policy:** AI *search* engines (ChatGPT Search, Perplexity, Claude, Google AI) stay allowed
  so the practice can appear in AI answers. Cloudflare's built-in "Content Signals" additionally **blocks
  AI *training* scrapers** (GPTBot, Google-Extended, CCBot, etc.) — free protection for the clinicians'
  original writing, at no cost to discoverability. (Keep-or-disable is the client's call.)

**Why it matters:** we protect the value of the practice's real content in search *and* work to erase
the spam that the hack left behind in Google.

**Status:** ✅ Redirects + 410s deployed live. ✅ XML sitemap (78 URLs) deployed. ✅ **Cleanup mode is
LIVE** — Google can now re-crawl and de-index the casino-spam (previously blocked), while the real pages
stay out of results via `noindex`. So the reputation cleanup is **actively running now**, not waiting for
launch. 🔜 At full launch we flip the gate to "live" (drop the noindex, advertise the sitemap) + submit
the Search Console removals. Timing: de-indexing ~1,042 URLs is gradual (days–weeks); Search Console's
Removals tool gives an instant ~6-month suppression in the meantime.

## 7. Content, authorship & structured data  ✅

**What we did**
- Built a per-clinician **author system**: every blog post carries a real byline, and each therapist has
  an **individual profile page** (linked from the team page and from their articles).
- Added **structured data (JSON-LD)** — the machine-readable markup that lets Google understand the
  organization, the people, and the articles (helps with rich results and E-E-A-T signals).
- Reconciled the entire recovered blog **back-catalog** so every post has the correct author, category,
  and SEO description — and established a **repeatable workflow** to turn a client brief into a live,
  fully-formatted, correctly-attributed post.
- A single source of truth (`content/team/`) drives the team grid, the profile pages, and the bylines.
- Docs: `docs/blog/{ARCHITECTURE,AUTHORS,INGESTION}.md`.

**Why it matters:** the practice's expertise is properly credited and structured for search engines,
and adding future posts is now a simple, repeatable process.

**Status:** ✅ Live for all clinicians and posts.

## 8. Bilingual blog (English + Spanish)  ✅

**What we did**
- Recovered and rebuilt the blog with **bilingual content (EN + ES)**, including correctly merging a
  duplicated Spanish post and preserving its URL via redirect.

**Why it matters:** the practice serves a bilingual community; the content and its search value are
preserved in both languages.

**Status:** ✅ 30 posts live (28 EN + 2 ES).

## 9. Forms & intake  ✅ (built; one live test pending)

**What we did**
- Built working **contact and careers forms** with reliable email delivery (Resend) and **bot/spam
  protection** (Cloudflare Turnstile).
- Designed them **privacy-consciously for a healthcare context** (minimizing sensitive info sent through
  standard email). Spec: `docs/research/resend-contact.md`.

**Why it matters:** prospective clients and applicants can reach the practice reliably, without the
form becoming a spam magnet, and with care taken around sensitive information.

**Status:** ✅ Built and functional in production. 🟡 Remaining: one real human end-to-end submit test,
and a sign-off on how much detail the contact message field should collect.

## 10. Design fidelity & a reusable design system  ✅

**What we did**
- Because the live site was compromised, we **recovered the pre-hack brand from the Wayback Machine** and
  codified it into a **design system** — brand colors, typography (Poppins + Lato), and reusable
  components — so the look is consistent and easy to extend.
- Rebuilt every page to match the original design 1:1 (the "table stakes" part), documented with
  before/after reference screenshots. Docs: `docs/DESIGN-SYSTEM.md`, `docs/design-reference/`.

**Why it matters:** the brand is faithfully preserved *and* now lives in a maintainable system rather
than a fragile page builder.

**Status:** ✅ Complete.

## 11. Documentation & handoff  ✅

**What we did**
- Produced ~20 documentation files covering the incident/forensics, the recovery pipeline, the site
  architecture, the DNS/email migration, and the SEO plan — so the work is transparent, maintainable,
  and transferable.

**Why it matters:** nothing is a black box; the practice (or any future developer) has a complete record.

**Status:** ✅ Ongoing, kept current.

---

## What's still ahead (so the email sets expectations honestly)

These are the remaining go-live items (tracked internally):

- 🔜 **Public launch flip** — the site is serving on the domain and is now in **cleanup mode** (crawled
  for spam-removal, but real pages "noindexed" so they're not yet in results). Launch = flip the gate to
  "live" (drop the noindex, advertise the sitemap) once you're ready to be publicly findable.
- 🟡 **Decommission the old hacked Bluehost/WordPress** and rotate all related passwords.
- 🟡 **Turn on DMARC** (Cloudflare's free dashboard tool) + optional Google DKIM repair.
- 🟡 **Final forms test** + intake/booking links pointed at the practice's real scheduling tool.
- ✅ **XML sitemap** built + deployed (78 pages; Vivian placeholder excluded).
- 🟡 **AI-crawler decision** — keep Cloudflare's AI-training block (recommended; free, no discovery cost)
  or disable it to allow all AI; optionally turn on Cloudflare's edge AI-bot blocking for real enforcement
  (robots.txt is only advisory). 🟡 Plus a few SEO niceties (per-page Open Graph images; optional EN/ES hreflang).

---

### Notes for whoever writes the email
- Lead with the security recovery — it's the highest-value, least-visible work and reframes the whole
  project from "a redesign" to "a rescue + upgrade."
- Keep it benefit-first and plain-language; the specifics above are backup, not the email body.
- Be accurate about what's live vs. pending (use the status tags) — don't imply the public launch or the
  old-server teardown are done when they aren't.
