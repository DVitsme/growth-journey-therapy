# WordPress → Markdown recovery pipeline (Growth Journey Therapy)

Verified 2026-07-09 on this machine. Every claim below was tested against real Wayback
snapshots of growthjourneytherapy.com unless marked otherwise.

## 0. Ground truth about the source HTML (tested, not assumed)

Fetched `https://web.archive.org/web/20230510194220id_/https://growthjourneytherapy.com/2023/05/03/what-is-cultural-deprivation/`:

- Theme is **`audrey-theme` (classic theme), NOT an Elementor-rendered post template**.
  Elementor is installed (its CSS loads) but post bodies are plain **Gutenberg** markup.
- Post content lives in **`article .entry-content`**. The `<article>` tag carries gold:
  `class="post-3347 post type-post status-publish format-standard category-psychology entry"`
  → post ID and category are recoverable from the class attribute.
  **NOTE: legit post ID 3347 is above the 1222–2004 range inferred from `?p=` Wayback URLs.
  Treat the legit/spam ID boundary as "< ~230000", not "< 2005".**
- Yoast emits `og:title`, `og:locale` (`en_US` / `es_ES`), `og:description`,
  `og:url`, `article:published_time` — clean frontmatter sources.
- Wayback `id_` responses come back **gzip-encoded**; you must decompress
  (`curl --compressed`, or `requests` which does it automatically).
- The archived RSS feed `web/20230509195429id_/https://growthjourneytherapy.com/feed/`
  contains **10 items with full `content:encoded` CDATA** — pristine Gutenberg HTML,
  Spanish accents intact (`psicología`, `¿Qué Es La Deprivación Cultural?`). This is the
  highest-fidelity source for the earliest posts. (It also contains theme demo posts —
  "How to Grow Your Instagram Following" etc. — exclude those.)
- Wayback `im_` with a loose timestamp works and resolves to the nearest capture:
  `/web/2023im_/<img-url>` → 302 → 200 raw bytes. Never pull images from the live site;
  it is actively compromised.

## 1. Input shapes (a) WXR / (b) SQL dump

### Winner for (a): `wordpress-export-to-markdown` v3.0.6 (lonekorean)
- Actively maintained: **v3.0.6 published 2026-07-05** (checked npm registry).
- Handles: YAML frontmatter (configurable field list), categories/tags, coverImage
  (featured image), inline ("scraped") + attached image download with URL rewrite,
  date folders, slug-named files, and it is UTF-8 clean.
- Verified CLI (ran `npx -y wordpress-export-to-markdown@3.0.6 --help`):

```bash
npx -y wordpress-export-to-markdown@3.0.6 \
  --wizard false \
  --input export.xml \
  --output content/blog-raw \
  --post-folders false \
  --date-folders none \
  --prefix-date false \
  --save-images all \
  --frontmatter-fields title,slug,date,excerpt,categories,tags,coverImage,author,draft \
  --request-delay 1500 \
  --include-time true --quote-date true
```

- Gaps (post-process required either way): no `lang`, no `translationKey`, no `seo.*`;
  and `--save-images` fetches from the **live compromised site** — if the WXR path wins,
  run with `--save-images none` and let the image fetcher in §3/§5 pull from Wayback instead.

### Rejected for (a):
- **wp2md** (PyPI 0.0.15): toy-stage, no image download, effectively abandoned. No.
- **exitwp**: Python-2-era Jekyll tool, dead for a decade (the `exitwp-for-hugo` fork
  targets Hugo front matter). No.
- **Roll our own**: unnecessary for WXR — but the §5 script's HTML→MD core is reused for
  post-processing anyway.

### For (b) raw `wp_posts` SQL dump — roll our own (no good off-the-shelf tool)
Do **not** stand up MySQL. Parse the dump directly and feed rows into the §5 converter:

```bash
pip3 install --user sqlglot   # or use the regex splitter below; dumps are simple INSERTs
python3 - <<'EOF'
# Extract legit posts from a wp_posts dump without a DB server.
# Filter: post_type='post', post_status='publish', ID < 230000  (spam IDs start ~234527)
# post_content is Gutenberg HTML + block comments -> same pandoc path as §2.
EOF
```
Practical filter set: `ID < 230000 AND post_type='post' AND post_status='publish'`,
plus manual review of titles (only ~10–20 legit posts exist). Also cross-check
`post_name` against the Wayback URL list — anything not in the archive and not
recognized by the owner is suspect.

## 2. Input shapes (c) archived HTML / (d) archived feed XML — the likely path

### Architecture: **extract first, convert second**. Never feed a whole page to a converter.

**Extraction step (deterministic selectors beat readability heuristics here):**
Selector cascade, first match wins:
1. `.elementor-widget-theme-post-content .elementor-widget-container` (Elementor single-post template — not used on the 2023 posts we inspected, but keep for any Elementor-built page)
2. `article .entry-content` ← **actual winner for this site's posts (verified)**
3. `.entry-content`
4. `main article`

Then decompose junk inside the match: `script, style, form, .sharedaddy,
.jp-relatedposts, .post-navigation, .wp-block-buttons, .ez-toc-container, nav`.
For Elementor pages, additionally `unwrap()` every `div` — pandoc ignores bare divs
anyway, so deep nesting is harmless after extraction.

`trafilatura` / Readability: use **only as fallback** when no selector matches
(e.g. a page rebuilt in a different theme). They are boilerplate strippers, not
converters, and their own markdown output flattens structure. Not needed as primary
because we have stable selectors.

### Converter comparison (HTML → Markdown)
| Tool | Verdict |
|---|---|
| **pandoc 3.1.3** (already installed at `/usr/bin/pandoc`) | **Winner.** `-f html -t gfm-raw_html --wrap=none` produced clean paragraphs, ordered lists, quotes from the real archived post (tested). `-raw_html` drops leftover tags instead of passing them through. Best-in-class list/table/nesting fidelity. Zero install. |
| turndown (JS) | Fine output, but needs node + jsdom scaffolding, keeps unknown tags unless configured, low maintenance activity. No advantage over installed pandoc. |
| html-to-markdown (Go, JohannesKaufmann) | High quality, but adds a Go toolchain for no gain. |
| markdownify (Python) | Convenient but weaker on nested lists/blockquotes; would still need pip install. |
| trafilatura | Extractor, not converter. Fallback role only. |

Verified conversion command (the exact one the script uses):
```bash
pandoc -f html -t gfm-raw_html --wrap=none
```

### (d) archived feed XML
`content:encoded` CDATA is already the clean inner HTML — skip extraction, go straight
to the junk-strip + image pass + pandoc. The §5 script auto-detects `<rss` input.
Only the newest 10 posts per feed snapshot; there are two feed snapshots
(2023-05-09 clean, 2026-02-10 **spam-poisoned — filter by ID/date/Cyrillic before use**).

## 3. Image handling (all fetches via Wayback, never the live site)

1. **Collect candidates** per `<img>`: `src`, `data-src`, `data-lazy-src`, and every URL
   in `srcset` (pick the largest `w` descriptor as a download fallback).
2. **Normalize**: strip any Wayback prefix `https://web.archive.org/web/<ts>(id_|im_)?/`
   to recover the original URL; resolve protocol-relative and relative URLs against
   `https://growthjourneytherapy.com`.
3. **Original-size recovery**: strip WordPress size suffix — regex
   `-\d+x\d+(?=\.(?:jpe?g|png|gif|webp)$)` — and try that first; fall back to the sized
   variants in descending width order.
4. **Fetch**: `https://web.archive.org/web/<ts>im_/<original-url>` where `<ts>` is the
   page snapshot's timestamp (Wayback redirects to the nearest capture; verified).
   Validate `Content-Type: image/*` and non-trivial size before accepting.
5. **Rewrite**: save to `public/images/blog/<slug>/<basename>` and rewrite the `<img src>`
   (and drop `srcset`) **before** pandoc runs, so the markdown comes out pointing at
   `/images/blog/<slug>/<basename>`.
6. `og:image` gets the same treatment → `coverImage` frontmatter.
7. Unrecoverable images: log to `report.json`, leave a `<!-- MISSING IMAGE: url -->` marker.

## 4. Frontmatter schema (bilingual therapy blog)

```yaml
---
title: "¿Qué Es La Deprivación Cultural?"   # H1 + <title>; from og:title minus " - Growth Journey Therapy"
slug: "que-es-la-deprivacion-cultural"      # URL segment; decoupled from filename so renames don't break links
date: "2023-05-01T18:12:26+00:00"           # article:published_time; drives sorting + <time> + JSON-LD datePublished
updated: "2023-05-02T09:00:00+00:00"        # article:modified_time when present; JSON-LD dateModified; omit if unknown
lang: "es"                                  # 'en' | 'es'; from og:locale/html[lang]; drives <html lang>, hreflang, route
translationKey: "cultural-deprivation"      # SAME value on the EN and ES versions of one article.
                                            # Language switcher + hreflang alternates = "find the other doc
                                            # with my translationKey and the other lang". Slugs differ per
                                            # language so slug cannot be the join key; this can.
excerpt: "Esto lo tienes que saber…"        # listing cards + RSS; from first paragraph or og:description
coverImage: "/images/blog/que-es-la-deprivacion-cultural/hero.jpg"  # local path; og:image + social cards
coverImageAlt: "Madre e hija conversando"   # a11y + SEO; WP alt text when present, else hand-written
categories: ["psicología"]                  # from <category> / article class category-*; keep per-language
                                            # names (psychology vs psicología) — they are display strings
tags: []                                    # WP tags if any; empty ok
author: "Growth Journey Therapy"            # single-author site; JSON-LD author; allows future guest posts
draft: false                                # lets us commit recovered-but-unreviewed posts without publishing
seo:
  title: "¿Qué Es La Deprivación Cultural? - Growth Journey Therapy"  # Yoast <title>; often ≠ display title
  description: "…"                          # Yoast meta description; preserve the exact string Google already
                                            # indexed — do not regenerate, that would reset SERP snippets
---
```

Why `translationKey` and not a `translations: {en: ..., es: ...}` map: the key is
symmetric (no post is "primary"), survives adding a third language, and can't dangle —
the build joins on it at render time and simply shows no switcher when unpaired.
Seed pairs from the known set, e.g. `what-is-cultural-deprivation` ↔
`que-es-la-deprivacion-cultural` (and `-2`), `your-turn-committed-students…` ↔
`tu-turno-estudiantes-comprometidos…`. With ~20 posts the pairing file is maintained by hand.

## 5. Runnable pipeline (Python 3.12, zero new installs)

Dependencies already present and verified on this machine: `python3 3.12.3`, `bs4 4.14.3`,
`lxml`, `PyYAML`, `requests 2.31.0`, `pandoc 3.1.3`.

Save as `wayback_to_md.py`. Inputs:
- `snapshots.txt` — one per line: `TIMESTAMP URL` (from the CDX API) **or** a full
  `https://web.archive.org/web/<ts>/<url>` line. Feed URLs (`…/feed/`) allowed; each
  item becomes a post.
- `translations.json` — `{ "<slug>": "<translationKey>", ... }` (optional; defaults to slug).

Outputs: `content/blog/<lang>/<slug>.md`, `public/images/blog/<slug>/*`,
`redirects.json`, `report.json`.

```python
#!/usr/bin/env python3
"""Wayback snapshot URLs -> content/blog/<lang>/<slug>.md + public/images/blog/<slug>/*."""
import json, pathlib, re, subprocess, sys, time
from urllib.parse import urljoin, urlparse
import requests, yaml
from bs4 import BeautifulSoup

OUT_CONTENT = pathlib.Path("content/blog")
OUT_IMAGES  = pathlib.Path("public/images/blog")
SITE        = "https://growthjourneytherapy.com"
NEW_PATH    = "/blog/{slug}"          # adjust to final route scheme before running
UA          = {"User-Agent": "gjt-recovery/1.0 (site owner restoring own content)"}
WB_PREFIX   = re.compile(r"^https?://web\.archive\.org/web/\d+(?:id_|im_|if_)?/")
SIZE_SUFFIX = re.compile(r"-\d+x\d+(?=\.(?:jpe?g|png|gif|webp)$)", re.I)
JUNK_SEL    = ("script,style,form,nav,.sharedaddy,.jp-relatedposts,"
               ".post-navigation,.wp-block-buttons,.ez-toc-container")
FOOTER      = re.compile(r"The post .{0,200}? appeared first on .{0,120}?\.", re.S)

def clean_text(html_or_text, limit=300):
    """Feed <description> arrives as HTML with a syndication footer; make it plain."""
    txt = BeautifulSoup(html_or_text, "lxml").get_text(" ", strip=True)
    txt = FOOTER.sub("", txt).replace("...Read More", "…").replace("Read More", "").strip()
    return (txt[:limit].rsplit(" ", 1)[0] + "…") if len(txt) > limit else txt
CONTENT_SEL = [".elementor-widget-theme-post-content .elementor-widget-container",
               "article .entry-content", ".entry-content", "main article"]
S = requests.Session(); S.headers.update(UA)
report, redirects, tkeys = [], {}, {}
if pathlib.Path("translations.json").exists():
    tkeys = json.loads(pathlib.Path("translations.json").read_text())

def wb_get(url, binary=False):
    for attempt in range(3):
        try:
            r = S.get(url, timeout=60, allow_redirects=True)
            if r.status_code == 200:
                return r.content if binary else r.text
            if r.status_code in (429, 503): time.sleep(20 * (attempt + 1)); continue
            return None
        except requests.RequestException: time.sleep(10)
    return None

def orig_url(u, base):
    u = WB_PREFIX.sub("", u.strip())
    if u.startswith("//"): u = "https:" + u
    return urljoin(base, u)

def fetch_image(candidates, ts, slug):
    OUT_IMAGES.joinpath(slug).mkdir(parents=True, exist_ok=True)
    for cand in candidates:
        name = pathlib.PurePosixPath(urlparse(cand).path).name or "image"
        dest = OUT_IMAGES / slug / name
        if dest.exists(): return f"/images/blog/{slug}/{name}"
        data = wb_get(f"https://web.archive.org/web/{ts}im_/{cand}", binary=True)
        time.sleep(1.5)
        if data and len(data) > 500 and not data[:200].lstrip().lower().startswith(b"<"):
            dest.write_bytes(data); return f"/images/blog/{slug}/{name}"
    return None

def localize_images(node, ts, slug, base):
    for img in node.find_all("img"):
        raw = [img.get("data-src"), img.get("data-lazy-src"), img.get("src")]
        pairs = re.findall(r"(\S+)\s+(\d+)w", img.get("srcset", ""))
        raw += [u for u, _ in sorted(pairs, key=lambda p: -int(p[1]))]
        cands, seen = [], set()
        for u in filter(None, raw):
            u = orig_url(u, base)
            if not u.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")): continue
            for v in (SIZE_SUFFIX.sub("", u), u):
                if v not in seen: seen.add(v); cands.append(v)
        local = fetch_image(cands, ts, slug) if cands else None
        if local:
            img.attrs = {"src": local, "alt": img.get("alt", "")}
        elif cands:
            report.append({"slug": slug, "missing_image": cands})
            img.replace_with(f"<!-- MISSING IMAGE: {cands[0]} -->")
        else:
            img.decompose()  # placeholder/tracking img with no usable source

def to_md(html):
    return subprocess.run(["pandoc", "-f", "html", "-t", "gfm-raw_html", "--wrap=none"],
                          input=html, capture_output=True, text=True, check=True).stdout.strip()

def meta(soup, **attrs):
    tag = soup.find("meta", attrs=attrs)
    return tag["content"].strip() if tag and tag.get("content") else None

def emit(slug, lang, fm, body_html, ts, old_path):
    frag = BeautifulSoup(body_html, "lxml")
    for el in frag.select(JUNK_SEL): el.decompose()
    for el in frag.find_all(["p", "li", "ol", "ul", "em", "strong"]):  # editor cruft:
        if not el.get_text(strip=True) and not el.find("img"):        # empty <ol><li></li></ol>,
            el.decompose()                                            # <p><br/></p> etc.
    localize_images(frag, ts, slug, SITE)
    inner = frag.body.decode_contents() if frag.body else str(frag)
    md = to_md(inner)
    out = OUT_CONTENT / lang / f"{slug}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    fmy = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, width=1000)
    out.write_text(f"---\n{fmy}---\n\n{md}\n", encoding="utf-8")
    if old_path and old_path != "/":
        redirects[old_path] = {"destination": NEW_PATH.format(slug=slug), "permanent": True}
    print(f"  wrote {out}")

def handle_page(ts, url):
    html = wb_get(f"https://web.archive.org/web/{ts}id_/{url}")
    if not html: report.append({"url": url, "error": "fetch failed"}); return
    soup = BeautifulSoup(html, "lxml")
    node = next((n for sel in CONTENT_SEL if (n := soup.select_one(sel))), None)
    if node is None: report.append({"url": url, "error": "no content selector"}); return
    canon = meta(soup, property="og:url") or url
    path = urlparse(canon).path
    slug = (path.rstrip("/").rsplit("/", 1)[-1]) or "index"
    locale = meta(soup, property="og:locale") or (soup.html.get("lang") or "en")
    lang = "es" if locale.lower().startswith("es") else "en"
    art = soup.find("article")
    cats = ([c.removeprefix("category-") for c in art.get("class", [])
             if c.startswith("category-")] if art else [])
    title = (meta(soup, property="og:title") or (soup.title.string if soup.title else slug))
    title = re.sub(r"\s*[-|–]\s*Growth Journey Therapy\s*$", "", title).strip()
    cover_remote = meta(soup, property="og:image")
    cover = None
    if cover_remote:
        cu = SIZE_SUFFIX.sub("", orig_url(cover_remote, SITE))
        cover = fetch_image([cu, orig_url(cover_remote, SITE)], ts, slug)
    fm = {"title": title, "slug": slug,
          "date": meta(soup, property="article:published_time"),
          "updated": meta(soup, property="article:modified_time"),
          "lang": lang, "translationKey": tkeys.get(slug, slug),
          "excerpt": meta(soup, attrs={"name": "description"}) or meta(soup, property="og:description"),
          "coverImage": cover, "coverImageAlt": "",
          "categories": cats, "tags": [], "author": "Growth Journey Therapy",
          "draft": True,
          "seo": {"title": soup.title.string.strip() if soup.title else title,
                  "description": meta(soup, attrs={"name": "description"})
                                 or meta(soup, property="og:description")}}
    fm = {k: v for k, v in fm.items() if v not in (None, "")}
    emit(slug, lang, fm, str(node), ts, path)

CYRILLIC = re.compile(r"[Ѐ-ӿ]")
def handle_feed(ts, url):
    xml = wb_get(f"https://web.archive.org/web/{ts}id_/{url}")
    if not xml: report.append({"url": url, "error": "feed fetch failed"}); return
    soup = BeautifulSoup(xml, "xml")
    for item in soup.find_all("item"):
        link = item.link.get_text(strip=True).split("?")[0]
        title = item.title.get_text(strip=True)
        if CYRILLIC.search(title) or CYRILLIC.search(link):
            report.append({"url": link, "skipped": "cyrillic spam"}); continue
        path = urlparse(link).path
        slug = path.rstrip("/").rsplit("/", 1)[-1]
        content = item.find("content:encoded") or item.find("encoded")
        if not content: continue
        cats = [c.get_text(strip=True) for c in item.find_all("category")]
        lang = "es" if re.search(r"[áéíóúñ¿¡]", title, re.I) or "psicolog" in " ".join(cats).lower() else "en"
        from email.utils import parsedate_to_datetime
        date = parsedate_to_datetime(item.pubDate.get_text(strip=True)).isoformat()
        desc = clean_text(item.description.get_text()) if item.description else None
        fm = {"title": title, "slug": slug, "date": date, "lang": lang,
              "translationKey": tkeys.get(slug, slug), "excerpt": desc,
              "categories": cats, "tags": [], "author": "Growth Journey Therapy",
              "draft": True, "seo": {"title": title, "description": desc}}
        fm = {k: v for k, v in fm.items() if v not in (None, "")}
        body = re.sub(r"<p>\s*The post .*?</p>", "", content.get_text(), flags=re.S)  # syndication footer
        emit(slug, lang, fm, body, ts, path)
        time.sleep(1.5)

def main():
    for line in pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "snapshots.txt").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"): continue
        m = re.match(r"https?://web\.archive\.org/web/(\d+)(?:id_)?/(.+)", line)
        ts, url = m.groups() if m else line.split(None, 1)
        print(f"[{ts}] {url}")
        (handle_feed if url.rstrip("/").endswith("/feed") else handle_page)(ts, url)
        time.sleep(2)
    pathlib.Path("redirects.json").write_text(json.dumps(redirects, indent=2, ensure_ascii=False))
    pathlib.Path("report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"done: {len(redirects)} redirects, {len(report)} issues -> report.json")

if __name__ == "__main__":
    main()
```

Build `snapshots.txt` from CDX (posts only, dedupe by urlkey, drop Cyrillic spam):

```bash
cd "$SCRATCH"
curl -s "https://web.archive.org/cdx/search/cdx?url=growthjourneytherapy.com&matchType=domain&output=json&fl=timestamp,original,statuscode&collapse=urlkey&filter=statuscode:200" \
| python3 -c "
import json,sys,re
rows=json.load(sys.stdin)[1:]
cyr=re.compile(r'[Ѐ-ӿ]|%D0|%D1')
for ts,url,code in rows:
    p=url.split('growthjourneytherapy.com',1)[-1]
    if cyr.search(url): continue
    if re.match(r'^/\d{4}/\d{2}/\d{2}/[^/]+/$', p) or p=='/feed/':
        print(ts,url)
" > snapshots.txt
python3 wayback_to_md.py snapshots.txt
```

Notes:
- Everything is written with `draft: true` — the owner reviews each post (only ~20 exist),
  fills `coverImageAlt`, confirms `translationKey` pairs, then flips drafts off.
- All Wayback calls sleep 1.5–2 s and back off on 429/503.
- Feed-sourced and page-sourced versions of the same slug: page version wins (richer
  Yoast metadata); the file is simply overwritten in slug order — put feed URLs first
  in `snapshots.txt`.

## 6. SEO preservation / redirect map for ~1000 URLs

**Emit format: a flat JSON object keyed by old pathname** — this is exactly the shape the
local Next.js 16 docs recommend (`node_modules/next/dist/docs/01-app/02-guides/redirecting.md`,
"Managing redirects at scale"):

```json
{
  "/2023/05/03/what-is-cultural-deprivation/": { "destination": "/blog/what-is-cultural-deprivation", "permanent": true },
  "/que-es-la-deprivacion-cultural/":          { "destination": "/blog/que-es-la-deprivacion-cultural", "permanent": true }
}
```

**Consumption — two sanctioned options in this Next.js version (verified against the
local docs, which OVERRIDE training data):**

1. `redirects()` in `next.config.ts` — fine for a few hundred static entries, but the
   docs warn platforms may cap it (e.g. 1,024) and every entry is checked per request.
2. **Recommended: `proxy.ts`** (this Next.js renamed middleware to *proxy* — the docs'
   scale example is literally `export async function proxy(request: NextRequest)`).
   Statically `import redirects from './redirects.json'` (a 1,000-entry map is ~100 KB,
   loaded once), do an O(1) key lookup on `request.nextUrl.pathname`, return
   `NextResponse.redirect(new URL(dest, request.url), 308)` on hit. The docs' Bloom-filter
   layer is for much larger maps; unnecessary at 1,000 entries.

Important redirect-map hygiene for this site:
- Only emit entries for **recovered legit content + known legit pages**. Do NOT wildcard
  old URLs: ~965 spam URLs must return **410 Gone** (or plain 404), never redirect —
  redirecting Russian pharma-spam URLs to the new site would funnel toxic signals at it.
  A cheap rule in `proxy.ts`: any unmatched `/YYYY/MM/DD/...` or Cyrillic/percent-encoded
  path → 410.
- Normalize before lookup: lowercase, strip trailing slash (store keys the same way).
- Both permalink shapes seen in the wild must be keyed: `/YYYY/MM/DD/slug/` **and** bare
  `/slug/` (Wayback shows both eras).
```
