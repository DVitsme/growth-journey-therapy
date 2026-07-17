# Live-site forensics — growthjourneytherapy.com — 2026-07-09

Read-only recon via WP REST API, Yoast sitemaps, and UA-differential page fetches.
Raw data in this directory: live-posts.json (1047 posts), pages-p1.json (35 pages),
categories.json, live-media.json (179), users.json, sitemap*.xml, home-*.html,
cloak-legit-*.html, spam-*.html, page83.json, cdx-uploads.txt.

## 1. Post inventory (1047 posts, 11 REST pages)

ID histogram:
| range           | count | verdict |
|-----------------|-------|---------|
| 740             | 1     | LEGIT (canvas-of-the-soul) |
| 230978–231319   | 17    | LEGIT |
| 231510–234527   | 1029  | SPAM |

**The Wayback hypothesis (her ids 1200–2100) is REFUTED for the live DB.** The site was
REBUILT ~July 2025 (Divi theme, media ids restart, all page/post ids re-assigned). Old
`?p=1222–2004` ids belong to the previous install and do not exist in the current DB
(legacy URLs like /2023/05/01/que-es-la-deprivacion-cultural/ now 404).

**Exact live boundary: legit post id <= 231319, spam post id >= 231510. Zero overlap,
zero exceptions.** 18 posts on her side, 1029 spam.

## 2. Her 18 legit posts (all English, all HTTP 200, titles/bodies intact)

| id | date | cat | url |
|----|------|-----|-----|
| 740 | 2024-10-11 | 18 | /2024/10/11/canvas-of-the-soul-the-intersection-of-art-and-self-expression/ |
| 230978 | 2024-10-11 | 16 | /2024/10/11/the-ripple-effects-of-remigration-unraveling-its-impact-on-family-bonds/ |
| 230979 | 2024-10-11 | 17 | /2024/10/11/navigating-the-silence-understanding-the-impact-of-language-barriers-on-mental-health/ |
| 230980 | 2024-10-11 | 18 | /2024/10/11/exploring-the-interplay-of-cultural-identity-and-personal-growth-a-journey-of-self-discovery-and-development/ |
| 230981 | 2024-10-11 | 18 | /2024/10/11/navigating-gender-identity-and-self-expression-a-journey-beyond-societal-norms/ |
| 230982 | 2024-10-11 | 18 | /2024/10/11/the-intricacies-of-self-identity-unraveling-the-psychological-underpinnings/ |
| 230983 | 2024-10-11 | 19 | /2024/10/11/philadelphias-chinatown-a-vibrant-haven-for-chinese-immigrants/ |
| 230984 | 2024-10-11 | 19 | /2024/10/11/riding-through-time-the-past-present-and-future-of-public-transportation-in-philadelphia/ |
| 231113 | 2026-03-03 | 18 | /2026/03/03/navigating-the-fear-of-deportation-coping-skills-to-reduce-anxiety/ |
| 231152 | 2026-03-06 | 17 | /2026/03/06/https-growthjourneytherapy-com-2026-03-06-sourcing-calm-from-the-outdoors-how-nature-helps-regulate-a-stressed-nervous-system/ (malformed slug, real post "Sourcing Calm from the Outdoors") |
| 231157 | 2026-03-06 | 18 | /2026/03/06/the-quiet-weight-of-imposter-syndrome-why-you-feel-like-you-dont-belong-and-how-to-cope/ |
| 231165 | 2026-03-06 | 17 | /2026/03/06/when-the-night-doesnt-feel-safe-trauma-hypervigilance-and-difficulty-sleeping/ |
| 231171 | 2026-03-06 | 17 | /2026/03/06/grief-that-comes-in-waves-why-it-returns-and-how-to-cope-with-compassion/ |
| 231197 | 2026-03-12 | 17 | /2026/03/12/high-functioning-but-exhausted-when-you-look-fine-but-feel-overwhelmed/ |
| 231203 | 2026-03-12 | 17 | /2026/03/12/family-separation-and-deportation-stress-coping-tools-for-undocumented-families/ |
| 231209 | 2026-03-12 | 18 | /2026/03/12/why-am-i-lonely-even-though-i-have-friends/ |
| 231239 | 2026-04-01 | 17 | /2026/04/01/high-functioning-burnout-when-youre-getting-everything-done-but-still-exhausted/ |
| 231319 | 2026-04-10 | 17 | /2026/04/10/stuck-in-a-procrastination-loop-how-to-take-action-without-motivation/ |

REST body audit of samples (231209, 231113, 230978, 740): 0 casino/bahis strings,
0 hidden links, 0 external hrefs. Post bodies are CLEAN. Last legit modification
2026-04-10 — all pre-compromise.

**The Spanish blog posts seen in Wayback (que-es-la-deprivacion-cultural, tu-turno-...)
do NOT exist on the live site (404). Spanish blog content is recoverable only from
Wayback.** Live Spanish content = the 3 Spanish group PAGES + /contacto no longer exists
either (not in the 35 live pages).

## 3. Categories (17 total)

LEGIT: 16 Family Life (1), 17 Stress (8), 18 Self Identity (7), 19 Philadelphia (2).
Live site has NO psychology/psicologia categories — those were on the pre-2025 install.
SPAM: 1 Uncategorized (965), 21–32 (casino/Games/Giochi/Spiele/News/Post/public/
"! Без рубрики"/a16z/Marketing News/25) = 64 posts. 965+64 = 1029.

## 4. Pages (35, ids 2–231303) — inventory clean, ONE defaced

All 35 pages are hers (home, consultation, team, methods + 14 therapy subpages,
mission, specialties + 3, FAQ, careers, community-resources, insurance-and-payment,
schedule-now, contact, blog, groups + 4 group subpages, sample-page). No spam pages.

**DEFACEMENT: page id 83 (Home) body was modified 2026-07-09T09:41:53 (today).**
Injected into post_content: ~48 hidden anchor links styled
`position:absolute; top:-9999px; left:-9999px` with Turkish gambling anchor text
(bettilt/pinup/pinco/bahsegel/paribahis/casinomhub/rokubet/slotbey) pointing at OTHER
compromised third-party sites (4elephantscatering.com, spice-hut.com, rusfin.org, …),
plus German/English casino paragraphs ("Chicken Road nv casino…"). Served to ALL UAs.
Every other page body: 0 injection markers. Next most recent page edit: team,
2026-05-08 (looks like a legit edit).

## 5. Sitemap vs REST delta: ZERO

post-sitemap.xml (1000) + post-sitemap2.xml (47) = 1047 URLs — decoded set is
IDENTICAL to the REST post list (comm: 0 / 0). Diagnostic conclusion: the spam is
ordinary wp_posts rows created through WordPress itself (compromised admin session /
plugin code path), not a doorway script bolted beside WP. Yoast happily sitemaps it.
page-sitemap (35) matches pages. author-sitemap: only /author/admin/.

## 6. Cloaking test

- Legit post (231209): browser vs Googlebot responses byte-identical. NO cloaking.
- Spam post (231524 "casinia"): 200 for both UAs, no redirect, body identical except:
- **UA-conditional artifact (all page types incl. homepage): Googlebot receives an extra
  injected inline `<style>` block truncating nav/menu link text (max-width:200px,
  ellipsis), and does NOT receive the Yoast og:description. Browsers get the
  og:description (spam text on the homepage).** This is mild UA-differential serving —
  evidence of PHP-level tampering (likely a snippet hooked on wp_head keyed off
  crawler UA) — but NOT redirect/content cloaking. Her content is identical either way.
- Spam monetization is via the hidden -9999px links and the spam posts themselves
  (they link internally; one external maps.app.goo.gl); no affiliate redirects observed.

## 7. Media (179 attachments)

178/179 are hers: rebuild-era Divi assets (2025/07–2025/09), team photos (2026/01),
blog heroes (2026/03–2026/04), re-imported 2024 blog images under
/wp-content/uploads/2024/09–10/. ONE spam-era item: id 233676,
2026/07/cw-image-zsrcw.png (uploaded 2026-07-08).
Sample byte-checks (7 URLs incl. logo, team photo, 2024 blog PNG, group flyers):
all 200/206 with genuine JPEG/PNG magic bytes. **Originals are intact on the server —
pull uploads from the live server or backup, Wayback needed only as fallback**
(Wayback holds ~182 uploads images per CDX).

## 8. IOC / fingerprint surface (passive)

- WordPress 6.9.4 (generator meta). Theme: **Divi 4.27.6**.
- Plugins visible: contact-form-7 6.1.5, molongui-authorship 5.2.9,
  divi-contact-form-helper 2.0.9, bluehost-wordpress-plugin 4.17.1, Yoast (27.4),
  Jetpack (+boost), Akismet, duplicate-post, regenerate-thumbnails, GoSMTP,
  **Code Snippets (code-snippets/v1 namespace)** ← classic persistence vector for
  DB-resident PHP; audit its snippets table first during cleanup.
- REST namespaces: large Newfold/Bluehost bundle (nfd-*, newfold-*, bluehost/v1, blu,
  mcp, wp-abilities/v1 — Bluehost AI/MCP tooling), wpcom/v2-3.
  No overtly fake namespaces observed.
- Single user exposed: id 1 "admin" (author of everything — author field useless as
  a discriminator).
- Spam posts still being created: newest id 234527 at 2026-07-09T16:09 (today).
  Cadence: 2026-06-29→07-05 trickle (~40), then 136/237/335/128 per day 07-06→07-09.
  Two spam posts backdated (2025-08-16, 2026-05-26 — modified 2026-07-07).

## 9. Discriminator rules (for extraction scripts)

1. wp_posts.ID <= 231319 → hers; ID >= 231510 → spam. (Posts. Pages all hers.)
2. Category ∈ {16,17,18,19} → hers; category ∈ {1,21..32} → spam. Perfect agreement
   with rule 1 on all 1047 posts.
3. post_modified <= 2026-04-10 → hers (posts); >= 2026-06-29 → spam.
   Do NOT trust post_date (spam backdates).
4. Non-ASCII (Cyrillic) slugs, or gambling/pharma/loan keywords in slug → spam.
5. Home page (id 83) content requires manual strip of everything from the first
   `<a href=... style="position: absolute; top: -9999px` onward (injection appended
   inside/after her final paragraph).
6. Media: keep all attachment ids <= 231340; drop 233676.
