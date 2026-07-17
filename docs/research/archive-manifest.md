# Growth Journey Therapy — blog recovery manifest (2026-07-09)

## Site history (reconstructed)
- **Gen1 (Dec 2022 – Nov 2023)**: Elementor/Genesis site, dated permalinks (`/YYYY/MM/DD/slug/`), categories `psychology` / `psicologia`. 7 real posts.
- **Gen2 (Nov 2023 – ~mid 2025)**: fresh WP install ~2023-11-21 (pages ids 724+, methods pages Jan 2024). Blog cohort of ~65 posts published Jan–Mar 2024, undated permalinks. By Sept 2024 permalinks were plain (`?p=`), captured by Wayback as `index.html@p=NNN.html`.
- **Gen3 (Jul 2025 – present, CURRENT)**: fresh Divi install (sample-page id 2, home id 83, pages Aug–Sep 2025). Only 8 of the 65 Gen2 posts were re-imported (backdated to 2024-10-11). 10 new real posts written Mar–Apr 2026 (ids 231113–231319). HACKED from ~2026-06-29.

## Hack onset evidence
- Her last real post: id 231319, 2026-04-10.
- Lowest spam id 231556 (`coronavirus-disease-2019`): date 2026-06-29T19:29:27, **modified 2026-06-29T19:29:53** — creation time. All lower-dated spam (2025-08-16 chilli-heat id 231859 mod 2026-07-01; 2026-05-26 youtube posts id 233311 mod 2026-07-07; 2026-06-06/06-25 posts with ids 232475–233920) has HIGHER ids and July 2026 modified stamps => **backdated**.
- Wayback crawl 2026-02-10 (/feed/, /comments/feed/, ?p=179) shows a completely clean site.
- Zero spam URLs in the Wayback CDX index (1,315 unique URLs).
- **Conclusion: injection began 2026-06-29, still active (id 234527 published 2026-07-09).**

## Spam discriminators
1. Category: spam is in `Uncategorized` (id 1, 965 posts) or spammer-created cats 21–32 (casino, Giochi, Spiele, News, Marketing News, "25", a16z, bez-rubriki, Post, public... note: cats 23 "Post" & 24 "public" & 22/25–32 are ALL spam; her real cats are 16 Family Life, 17 Stress, 18 Self Identity, 19 Philadelphia).
2. Post id: real = 740 or 230978–231319 (+ Gen1/Gen2 historical ids ≤ 5052). Spam = 231556+ (except nothing real above 231319).
3. Real posts: EN/ES therapy/immigrant/Philadelphia/stress topics. Spam: casino/betting/pharma in DE/IT/PL/FR/FI/NL/ES/EL/AR/Cyrillic; slugs with underscores-in-titles; Cyrillic %d0/%d1 slugs.
4. Any post dated after 2026-04-10 that isn't in the 10-post 2026 list below = spam.

## HIGH-VALUE RECOVERY ARTIFACTS
1. **Wayback /feed/ capture 2026-02-10** — FULL content:encoded for the 8 Gen2 survivor posts:
   `https://web.archive.org/web/20260210111337id_/https://growthjourneytherapy.com/feed/` (gzip! pipe through gunzip)
2. **Wayback /feed/ capture 2023-05-09** — FULL content for the 3 May-2023 Gen1 posts (+ 6 theme-demo posts):
   `https://web.archive.org/web/20230509195429id_/https://growthjourneytherapy.com/feed/` (gzip)
3. **Live wp-json (site still up, still owned by attacker — PULL NOW)**:
   `https://growthjourneytherapy.com/wp-json/wp/v2/posts?include=740,230978,230979,230980,230981,230982,230983,230984,231113,231152,231157,231165,231171,231197,231203,231209,231239,231319&per_page=20`
   Content of the 2026 posts is wrapped in literal Divi `[et_pb_*]` shortcodes — strip them.
4. Per-post page snapshots (id_ raw URLs) listed below.

## Legit posts

### Gen1 (2023, Elementor site)
| # | URL | lang | published | recovery | best snapshot (id_) |
|---|-----|------|-----------|----------|---------------------|
| 1 | /2023/05/01/que-es-la-deprivacion-cultural/ | es | 2023-05-01 | yes-archive | web.archive.org/web/20230508034904id_/https://growthjourneytherapy.com/2023/05/01/que-es-la-deprivacion-cultural/ (also in feed-2023) |
| 2 | /2023/05/02/que-es-la-deprivacion-cultural-2/ | es | 2023-05-02 | yes-archive (near-dup of #1) | web.archive.org/web/20230509195429id_/.../2023/05/02/que-es-la-deprivacion-cultural-2/ |
| 3 | /2023/05/03/what-is-cultural-deprivation/ | en | 2023-05-03 | yes-archive | web.archive.org/web/20230510194220id_/.../2023/05/03/what-is-cultural-deprivation/ |
| 4 | /2023/06/11/reuniones-en-la-escuela-un-compromiso-de-los-padres/ | es | 2023-06-11 | PARTIAL — no page capture; title+teaser on /mi-blog/ 20230723033133 | — |
| 5 | /2023/06/11/school-meetings-a-parental-commitment/ | en | 2023-06-11 | PARTIAL — title+teaser on /my-blog/ 20230723033135 ("School meetings are often not very desirable for parents...") | — |
| 6 | /2023/11/10/tu-turno-estudiantes-comprometidos-que-crean-habitos-de-estudios-responsables/ | es | 2023-11-10 | yes-archive | web.archive.org/web/20231110234323id_/... (also per-post feed 20231117234955) |
| 7 | /2023/11/10/your-turn-committed-students-who-create-responsible-study-habits/ | en | 2023-11-10 | yes-archive | web.archive.org/web/20231110231820id_/... |

### Gen2 (2024 cohort; original publish dates Jan–Mar 2024)
| # | slug | recovery | best source |
|---|------|----------|-------------|
| 8 | what-is-main-character-syndrome | yes-archive (deleted live) | web.archive.org/web/20240314221827id_/https://growthjourneytherapy.com/what-is-main-character-syndrome/ |
| 9 | navigating-the-past-present-and-future-of-philadelphias-public-transportation-system | yes-archive (deleted live; near-dup of #15) | 20240314221716id_ |
| 10 | building-bridges-across-cultures-navigating-family-dynamics-as-immigrants | yes-archive (deleted live) | 20240907043831id_ |
| 11 | exploring-the-heart-of-innovation-philadelphias-legacy-of-pioneering-moments | yes-archive (deleted live) | 20240909124429id_ |
| 12 | exploring-stress-from-various-cultural-angles-... | yes-archive (deleted live) | web.archive.org/web/20240910220839id_/https://growthjourneytherapy.com/index.html@p=3500.html |
| 13 | exploring-the-cultural-gem-of-philadelphia-... | yes-archive (deleted live) | web.archive.org/web/20240910220853id_/https://growthjourneytherapy.com/index.html@p=3530.html |
| 14 | canvas-of-the-soul-... (live id 740) | yes-both | 20240711002813id_ + feed-2026 + live |
| 15 | riding-through-time-... (live 230984) | yes-both | 20240314221904id_ + feed-2026 + live |
| 16 | navigating-gender-identity-... (live 230981) | yes-both | @p=3553 20240914034446id_ + feed-2026 + live |
| 17 | the-ripple-effects-of-remigration-... (live 230978) | yes-both | @p=3572 20240914141822id_ + feed-2026 + live |
| 18 | philadelphias-chinatown-... (live 230983) | yes-both | feed-2026 + live |
| 19 | the-intricacies-of-self-identity-... (live 230982) | yes-both | feed-2026 + live |
| 20 | exploring-the-interplay-of-cultural-identity-... (live 230980) | yes-both | feed-2026 + live |
| 21 | navigating-the-silence-...-language-barriers-... (live 230979) | yes-both | feed-2026 + live |
| 22 | navigating-lifes-challenges-the-interplay-of-self-identity-and-resilience | NO — only a 404 capture (20240912); title from slug only | — |

### 2026 posts (live only, never archived — ids 231113–231319, cats Stress/Self Identity)
23. navigating-the-fear-of-deportation-coping-skills-to-reduce-anxiety (231113, 2026-03-03)
24. sourcing-calm-from-the-outdoors-... (231152, 2026-03-06; slug malformed "https-growthjourneytherapy-com-...")
25. the-quiet-weight-of-imposter-syndrome-... (231157, 2026-03-06)
26. when-the-night-doesnt-feel-safe-trauma-hypervigilance-... (231165, 2026-03-06)
27. grief-that-comes-in-waves-... (231171, 2026-03-06)
28. high-functioning-but-exhausted-... (231197, 2026-03-12)
29. family-separation-and-deportation-stress-... (231203, 2026-03-12)
30. why-am-i-lonely-even-though-i-have-friends (231209, 2026-03-12)
31. high-functioning-burnout-... (231239, 2026-04-01)
32. stuck-in-a-procrastination-loop-... (231319, 2026-04-10)
All: recover via live wp-json NOW.

### Unrecoverable Gen2 slugs (48) — in 2024-07-11 post-sitemap, deleted by owner in the 2025 rebuild, never captured
See unrecovered-2024-cohort.json. Titles derivable from slugs. This cohort reads as bulk-produced SEO content; owner deliberately kept only 8, so low priority.

### Excluded as theme demo / default content
hello-world (2022-12-27), hello-world-2, and the 2018–2020 posts in the 2023-07 sitemap (chocolate-espresso-smoothie, branding-101-*, how-to-grow-instagram-following, 10-must-listen-podcasts, creating-memorable-onboarding-experience, 3-simple-steps-starting-website, how-to-organically-boost-traffic, why-you-need-to-make-self-care-priority, 4-sunday-night-tips, how-coworking-spaces-benefit-creativity, sample-post-with-full-width-layout, sidebar-post) — theme starter content, present in feed-2023 with full text if ever wanted.

## Images
CDX query:
`https://web.archive.org/cdx/search/cdx?url=growthjourneytherapy.com/wp-content/uploads/*&output=text&fl=timestamp,original,statuscode,mimetype&collapse=urlkey&filter=statuscode:200`
=> 306 rows: 167 jpeg + 12 png + 3 webp = **182 archived images**. Bulk pull realistic (fetch each as `https://web.archive.org/web/<ts>im_/<original>` with ~1s spacing, ≈5 min). BETTER: the live site still serves uploads — enumerate via `/wp-json/wp/v2/media?per_page=100` and pull from origin now (filter spam media by date > 2026-06-29).

## Pages (best snapshots)
- Gen3 live page ids: 2,83,113,179,211,223,236,243–751 (Jul–Sep 2025), 230712 contact, 230964 blog, 231243–231303 groups. Pull from live wp-json.
- Archived Gen2 pages incl. full text: index.html@p= snapshots for FAQ(724), Get Started(725), Contact(726), Specialties(727), Couples(728), Burnout(729), Privacy(1222), Terms(1225), Good Faith(1227), Methods(1948) + 13 method pages (1950–1976), Depression(1980), Immigration Anxiety(1984), Cultural Integration(1986), Trauma Informed(1990), Grief and Loss(1992), Telehealth(1998), Insurance(2000), Policies(2004), Schedule(2269), Resources(2282), Press(2284), Image Rights(2286), About(2292), Careers(3001), team bios (5026–5052: Anne Marie, Jabes Reyes, Christina Holiday, Alexandra Rodriguez, Nelendy De Leon). Sept 2024 timestamps in atp-pages.json.
- Gen1 ES pages archived: /contacto/, /mis-servicios/, /sobre-nelsery-de-leon/, /mi-blog/.
- Homepage "BiPoc LatinX Therapy in Philly": 20240910182406 (served at /2024/02/01/).
