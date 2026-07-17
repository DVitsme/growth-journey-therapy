# Post Recovery — Growth Journey Therapy
**Authoritative inventory + exact fetch commands. Verifier-corrected 2026-07-09.**
Every Tier A/B row below was re-fetched and confirmed this session by the post-list verifier.

## Confidence statement

- **80 real posts** were ever published (Gen1 2023: 7 · Gen2 2024: 63 · Gen3 2026: 10). *high confidence.*
- **27 unique articles are fully recoverable right now** (29 sources − 2 near-duplicates): 18 from the
  live REST API, 11 from Wayback (2 of which are near-dups of live posts). *high confidence, each
  verified by direct fetch.*
- **2 posts are partial** (title + a verbatim-verified teaser only; bodies exist only in a backup). *high.*
- **49 posts are title-only** — the bulk-SEO Gen2 cohort the owner deleted in her 2025 rebuild; bodies
  are unrecoverable without a pre-2025 backup. *high that they existed.*
- **Ship the 27.** The 49 are low-value and already abandoned by the owner; recover only on request.

## Spam discriminator rules (VERIFIER-CORRECTED — override ground truth + 2 recon agents)

1. **ID (current DB):** `id ≤ 231319` → hers; `id ≥ 231510` → spam. **Nothing between.** First spam =
   **id 231510**, created 2026-06-29T15:07:14. (Ground truth said 234527; two agents said 231556 — both wrong.)
2. **Category (cleanest):** legit = **16 Family Life, 17 Stress, 18 Self Identity, 19 Philadelphia**
   (counts 1/8/7/2 = exactly 18). Spam = **1 Uncategorized (965)** + **21–32 (64)**.
   ⚠ `?categories_exclude=1` returns **82** and still includes the 64 spam in cats 21–32 — use
   **`?categories=16,17,18,19`** instead.
3. **`post_modified` ≥ 2026-06-29 → spam. Do NOT trust `post_date`** (spam backdates to 2025-08-16).
4. Cyrillic slug, percent-encoded `%d0/%d1`, or gambling/pharma keywords → spam.
5. Old `?p=1222–2004` are **pages**, not posts (REFUTED hypothesis). A pre-2025 backup would use post
   ids **~3253–3573**, not 231xxx.
6. Live rendered HTML is contaminated on **every** page (`trainer71245.icu` fake-captcha script + spam
   "recent posts"). **Extract content ONLY from wp-json REST fields or a DB dump — never scrape rendered pages.**

---

## TIER A — LIVE, full text via wp-json (18 posts, all English) — PULL NOW

Site is still attacker-controlled; these 10 Gen3 posts (231113–231319) exist **nowhere else** (zero
Wayback captures under `/2026/`). Already saved to `scratchpad/alt-sources/*.txt` (strip Divi
`[et_pb_*]` shortcodes; verified free of injected links). EN/ES pair column: all Tier A are **EN-only**.

| slug | date (true) | postId | source | best snapshot |
|---|---|---|---|---|
| canvas-of-the-soul-the-intersection-of-art-and-self-expression | 2024-10-11 (orig ~2024-03) | 740 | live + wayback + feed-2026 | live REST id 740 |
| the-ripple-effects-of-remigration-unraveling-its-impact-on-family-bonds | 2024-03-12 | 230978 | live + wayback @p=3572 | `…20240914141822id_/…@p=3572` |
| navigating-the-silence-understanding-the-impact-of-language-barriers-on-mental-health | 2024 (Jan–Mar) | 230979 | live + feed-2026 | live REST id 230979 |
| exploring-the-interplay-of-cultural-identity-and-personal-growth-a-journey-of-self-discovery-and-development | 2024 | 230980 | live + feed-2026 | live REST id 230980 |
| navigating-gender-identity-and-self-expression-a-journey-beyond-societal-norms | 2024-03-12 | 230981 | live + wayback @p=3553 | `…20240914034446id_/…@p=3553` |
| the-intricacies-of-self-identity-unraveling-the-psychological-underpinnings | 2024 | 230982 | live + feed-2026 | live REST id 230982 |
| philadelphias-chinatown-a-vibrant-haven-for-chinese-immigrants | 2024 | 230983 | live + feed-2026 | live REST id 230983 |
| riding-through-time-the-past-present-and-future-of-public-transportation-in-philadelphia | 2024-03-12 | 230984 | live + wayback | `…20240314221904id_/…` |
| navigating-the-fear-of-deportation-coping-skills-to-reduce-anxiety | 2026-03-03 | 231113 | **live ONLY** | live REST id 231113 |
| sourcing-calm-from-the-outdoors-how-nature-helps-regulate-a-stressed-nervous-system ⚠slug malformed on live (`https-growthjourneytherapy-com-2026-03-06-…`) — **rename on migration** | 2026-03-06 | 231152 | **live ONLY** | live REST id 231152 |
| the-quiet-weight-of-imposter-syndrome-why-you-feel-like-you-dont-belong-and-how-to-cope | 2026-03-06 | 231157 | **live ONLY** | live REST id 231157 |
| when-the-night-doesnt-feel-safe-trauma-hypervigilance-and-difficulty-sleeping | 2026-03-06 | 231165 | **live ONLY** | live REST id 231165 |
| grief-that-comes-in-waves-why-it-returns-and-how-to-cope-with-compassion | 2026-03-06 | 231171 | **live ONLY** | live REST id 231171 |
| high-functioning-but-exhausted-when-you-look-fine-but-feel-overwhelmed | 2026-03-12 | 231197 | **live ONLY** | live REST id 231197 |
| family-separation-and-deportation-stress-coping-tools-for-undocumented-families | 2026-03-12 | 231203 | **live ONLY** | live REST id 231203 |
| why-am-i-lonely-even-though-i-have-friends | 2026-03-12 | 231209 | **live ONLY** | live REST id 231209 |
| high-functioning-burnout-when-youre-getting-everything-done-but-still-exhausted | 2026-04-01 | 231239 | **live ONLY** | live REST id 231239 |
| stuck-in-a-procrastination-loop-how-to-take-action-without-motivation (her last real post) | 2026-04-10 | 231319 | **live ONLY** | live REST id 231319 |

---

## TIER B — DELETED from live; FULL TEXT in Wayback (11 posts) — all re-verified today

| slug | lang | date (true) | old postId | best snapshot (id_) | EN/ES pair |
|---|---|---|---|---|---|
| que-es-la-deprivacion-cultural | es | 2023-05-01 | 3253 | `…20230508034904id_/…/2023/05/01/que-es-la-deprivacion-cultural/` + feed-2023 | ↔ what-is-cultural-deprivation |
| que-es-la-deprivacion-cultural-2 *(near-dup — publish only one)* | es | 2023-05-02 | 3270 | `…20230509195429id_/…/2023/05/02/…-2/` + feed-2023 | (dup) |
| what-is-cultural-deprivation | en | 2023-05-03 | — | `…20230510194220id_/…/2023/05/03/what-is-cultural-deprivation/` + feed-2023 | ↔ que-es-la-deprivacion-cultural |
| tu-turno-estudiantes-comprometidos-que-crean-habitos-de-estudios-responsables | es | 2023-11-10 | 3572 | `…20231110234323id_/…` + per-post feed `20231117234955` | ↔ your-turn-committed-students… |
| your-turn-committed-students-who-create-responsible-study-habits | en | 2023-11-10 | 3573 | `…20231110231820id_/…` | ↔ tu-turno-estudiantes… |
| what-is-main-character-syndrome | en | 2024-01-11 | — | `…20240314221827id_/…/what-is-main-character-syndrome/` | — |
| building-bridges-across-cultures-navigating-family-dynamics-as-immigrants | en | 2024-03-12 | — | `…20240907043831id_/…` | — |
| exploring-the-heart-of-innovation-philadelphias-legacy-of-pioneering-moments | en | 2024-03-12 | — | `…20240909124429id_/…` | — |
| exploring-stress-from-various-cultural-angles-perspectives-impacts-and-coping-strategies | en | 2024-03-12 | 3500 | `…20240910220839id_/…/index.html@p=3500.html` | — |
| exploring-the-cultural-gem-of-philadelphia-a-journey-through-its-iconic-venue | en | 2024-03-12 | 3530 | `…20240910220853id_/…/index.html@p=3530.html` | — |
| navigating-the-past-present-and-future-of-philadelphias-public-transportation-system *(near-dup of riding-through-time — probably SKIP)* | en | 2024-03-12 | — | `…20240314221716id_/…` | — |

## TIER C — PARTIAL (title + verbatim teaser only; body only in a backup)

| slug | lang | date | teaser source | EN/ES pair |
|---|---|---|---|---|
| reuniones-en-la-escuela-un-compromiso-de-los-padres | es | 2023-06-11 | `…20230723033133id_/…/mi-blog/` ("Las reuniones escolares no suelen ser muy deseadas por los padres…") | ↔ school-meetings-a-parental-commitment |
| school-meetings-a-parental-commitment | en | 2023-06-11 | `…20230723033135id_/…/my-blog/` ("School meetings are often not very desirable for parents…") | ↔ reuniones-en-la-escuela… |

## TIER D — TITLE-ONLY (49, backup-only)

Full slug list in `scratchpad/unrecovered-2024-cohort.json` and `FINAL-POST-LIST.md`. Bulk-generated
English SEO content (two slugs still carry a literal `title-` AI-prompt prefix). Recover only from a
**pre-2025** backup, only if the client asks. Low priority.

## EN/ES translation pairs (exactly 3, all Gen1/2023)

1. `que-es-la-deprivacion-cultural` (es) ↔ `what-is-cultural-deprivation` (en)
2. `reuniones-en-la-escuela-un-compromiso-de-los-padres` (es) ↔ `school-meetings-a-parental-commitment` (en) *(both partial)*
3. `tu-turno-estudiantes-comprometidos…` (es) ↔ `your-turn-committed-students…` (en)

The entire 2024 cohort and all 10 of the 2026 posts are **English-only**.

## EXCLUDED (do not migrate — theme demo / default)

hello-world, hello-world-2, sample-post-with-full-width-layout, sidebar-post,
chocolate-espresso-smoothie, branding-101-ultimate-color-palette-guide, branding-101-ultimate-font-pairing-guide,
how-coworking-spaces-benefit-creativity, 4-sunday-night-tips-easier-workweek, why-you-need-to-make-self-care-priority,
how-to-organically-boost-traffic-to-website, 3-simple-steps-starting-website, 10-must-listen-podcasts,
creating-memorable-onboarding-experience, how-to-grow-instagram-following (all dated 2018–2020; theme starter content).

---

## Exact fetch commands (all respect the 4.6 GB disk limit)

Set a small output dir:
```bash
OUT=/tmp/claude-1000/-home-nero-Clients-growthjourneytherapy/9b67c8f1-0efe-424a-863e-5378b9be898a/scratchpad/recovered
mkdir -p "$OUT"/{posts,pages,wayback,images}
```

### A. Live posts (Tier A) — clean JSON, never the rendered page

The 18 legit posts are already at `scratchpad/alt-sources/*.txt`. To re-pull reproducibly (content is
in `content.rendered`, wrapped in Divi `[et_pb_*]` shortcodes to strip):

```bash
IDS=740,230978,230979,230980,230981,230982,230983,230984,231113,231152,231157,231165,231171,231197,231203,231209,231239,231319
curl -s "https://growthjourneytherapy.com/wp-json/wp/v2/posts?include=$IDS&per_page=20&_fields=id,slug,date,modified,title,content,excerpt,categories,yoast_head_json" \
  > "$OUT/posts/live-legit.json"
# Sanity: confirm exactly the legit set and nothing with id>=231510
python3 - "$OUT/posts/live-legit.json" <<'PY'
import json,sys
d=json.load(open(sys.argv[1]))
print("count",len(d))
print("max id",max(p["id"] for p in d), "-> must be 231319")
bad=[p["id"] for p in d if p["id"]>=231510]
print("spam ids present:",bad or "none")
PY
```

Equivalent clean pull by category (also returns exactly 18):
```bash
curl -s "https://growthjourneytherapy.com/wp-json/wp/v2/posts?categories=16,17,18,19&per_page=100&_fields=id,slug,date,title,content,excerpt,categories" \
  > "$OUT/posts/live-by-category.json"
```

### B. Live pages (all 35 are hers; strip the Home id-83 injection)

```bash
curl -s "https://growthjourneytherapy.com/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,link,title,content,modified" \
  > "$OUT/pages/live-pages.json"
# Home page (id 83) body was defaced today — strip from the first hidden anchor onward:
#   remove everything from the first  <a href=... style="position: absolute; top: -9999px  onward.
```

### C. Wayback posts (Tier B) — raw HTML via `id_`, then extract + convert

`id_` responses are **gzip-encoded**; `curl --compressed` (or Python `requests`) decompresses. Extract
`article .entry-content`, then `pandoc`. Example for one post:

```bash
TS=20240314221827 ; URL="https://growthjourneytherapy.com/what-is-main-character-syndrome/"
curl --compressed -s "https://web.archive.org/web/${TS}id_/${URL}" -o "$OUT/wayback/main-character.html"
# extract the article body and convert (bs4 + pandoc, both installed):
python3 - "$OUT/wayback/main-character.html" <<'PY' > /tmp/body.html
import sys; from bs4 import BeautifulSoup
soup=BeautifulSoup(open(sys.argv[1],encoding="utf-8"),"lxml")
node=soup.select_one("article .entry-content") or soup.select_one(".entry-content")
for junk in node.select("script,style,form,.sharedaddy,.jp-relatedposts,.post-navigation,nav"): junk.decompose()
print(node.decode_contents())
PY
pandoc -f html -t gfm-raw_html --wrap=none /tmp/body.html -o "$OUT/wayback/main-character.md"
```

Highest-fidelity source for the 2023 Spanish/EN originals is the **archived RSS feed** (full
`content:encoded`, accents intact) — one fetch yields several posts:

```bash
# 2023 feed: que-es-la-deprivacion-cultural (+dup), what-is-cultural-deprivation, tu-turno/your-turn era
curl --compressed -s "https://web.archive.org/web/20230509195429id_/https://growthjourneytherapy.com/feed/" \
  -o "$OUT/wayback/feed-2023.xml"
# 2026 feed: the 8 Gen2 survivors' full bodies (spam-poisoned capture — filter by ID/date/Cyrillic before use)
curl --compressed -s "https://web.archive.org/web/20260210111337id_/https://growthjourneytherapy.com/feed/" \
  -o "$OUT/wayback/feed-2026.xml"
```

Loop the remaining Tier B posts from the `timestamp id_/url` pairs in the table above (sleep ~1s
between fetches to respect archive.org).

### D. Images — pull her originals from the live server (Wayback fallback)

Her uploads are intact on the live server (verified genuine JPEG/PNG magic bytes). ~182 images,
~0.2–0.5 GB — fits. Enumerate the media library, exclude attacker uploads:

```bash
# list all media (paginate; x-wp-total ~179)
for p in 1 2; do
  curl -s "https://growthjourneytherapy.com/wp-json/wp/v2/media?per_page=100&page=$p&_fields=id,date,source_url,mime_type" \
    >> "$OUT/images/media-raw.json"
done
# keep only real images: attachment id <= 231340, date < 2026-06-29, drop id 233676 (spam png)
python3 - "$OUT/images/media-raw.json" <<'PY' > "$OUT/images/urls.txt"
import json,sys,re
txt=open(sys.argv[1]).read()
for chunk in re.findall(r'\[.*?\]',txt,re.S):
    try: arr=json.loads(chunk)
    except: continue
    for m in arr:
        if m["id"]>=231510 or m["id"]==233676: continue
        if m.get("date","")>="2026-06-29": continue
        if m.get("mime_type","").startswith("image/"): print(m["source_url"])
PY
# download originals only (skip WP -WxH resized copies), with a size guard:
mkdir -p "$OUT/images/files"
while read u; do
  case "$u" in *-[0-9]*x[0-9]*.*) continue;; esac   # skip resized derivatives
  curl -s "$u" -o "$OUT/images/files/$(basename "$u")"
done < "$OUT/images/urls.txt"
du -sh "$OUT/images/files"   # must be well under free space
```

Wayback image fallback (only for files the attacker may have deleted) — loose timestamp `im_` 302s to
the nearest capture:
```bash
curl -L -s "https://web.archive.org/web/2023im_/https://growthjourneytherapy.com/wp-content/uploads/2023/01/cropped-Untitled-design-25.png" -o img.png
```
Full archived-image list: `scratchpad/cdx-uploads.txt` (182 images).

### E. Post-download hygiene (mandatory — these came off a compromised host)

```bash
# no PHP/webshells should have slipped in:
find "$OUT/images" -type f ! \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \
  -o -iname '*.gif' -o -iname '*.webp' -o -iname '*.pdf' \) -print -delete
# treat SVGs as untrusted (script-capable) — drop unless a legit post references one.
```
Re-encode every image during the build (strips polyglot payloads + EXIF), and **never** open recovered
HTML/SVG in a browser during triage, and **never** `dangerouslySetInnerHTML` recovered content.
