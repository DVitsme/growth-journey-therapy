# Growth Journey Therapy — design system (from pre-hack site, 2026-02-17 Wayback)

Reference screenshots: `docs/design-reference/*.png`. Authoritative page content: `_recovery/wordpress-export/gjt-pages.xml` (Divi; strip injected casino spam like "bettilt/pinco/bahsegel").

## Brand palette (exact values pulled from the archived Divi CSS)

| Token | Hex | Use |
|---|---|---|
| `green` (primary) | `#2f7863` | header, footer, journey cards, buttons, heading accents |
| `green-deep` | `#285f4f` | hover/pressed, darker green blocks (derived) |
| `sage` (accent) | `#a1b75b` | hero right-panel background, botanical highlights |
| `sage-soft` | `#78a05e` | secondary green |
| `gold` | `#e0c588` | small accents, dividers |
| `terracotta` | `#c5824a` | phone-number link, warm CTA accent |
| `paper` | `#ffffff` / `#faf9f6` | page background |
| `panel` | `#eceeec` / `#f3f3f3` | gray content panels (contact left col, alt sections) |
| `ink` | `#2b2a28` | body text |

Botanical white leaf line-art is a recurring motif (hero background, journey cards). Logo is a white
leaf-mark + "Growth Journey" wordmark (image asset, not web font) — white on green in header/footer.

## Typography

- **Poppins** — headings/display (light weights 300–500 give the airy, elegant feel). via `next/font/google`.
- **Lato** — body copy. via `next/font/google`.
- Headings are green (`#2f7863`) on light backgrounds, white on green.

## Components observed

- **Header** (green, sticky): white logo left; nav right — About▾, Methods▾, Specialties▾, Explore More▾, Contact. Dropdowns.
- **Hero**: full-bleed family photo left, sage panel right with white botanical leaves; right-aligned white headline ("We Understand you / We Speak your language / Tools for living") + "START YOUR JOURNEY" pill button.
- **Journey cards** ("The Stages of Your Journey"): 4 green squares, white botanical corner art, white labels — Phone Consultation, First Appointment, Ongoing Care, Live Better.
- **Buttons**: pill/rounded; solid green (white text) or outlined green; uppercase letter-spaced label.
- **Forms** (contact): outlined inputs, uppercase small labels, gold focus ring; outlined green SUBMIT pill. Two-column: gray info panel + form.
- **Footer** (green): logo, phone (267) 713-8831, address 2201 Pennsylvania Ave Suite 101 Philadelphia PA 19130, email growthjourney.therapy@gmail.com, "Quick Links", "Philadelphia, PA (in person) / All of Pennsylvania via Telehealth".

## Homepage section order (from DB, spam-stripped)

1. Hero — "We Understand you / We Speak your language / Tools for living" + CTA
2. "You Are Welcome Here" — intro copy (serves immigrant & BIPOC communities; individual/family/couples; **bilingual**)
3. "The Stages of Your Journey" — the 4 journey cards + "Read More About Our Methods"
4. "Our Methods" — methods overview + "Learn More"
5. "Our Team"
Images: `home-hero-scaled.jpg` (2025/08), `hero-v4.jpg` (2025/09) — in `_recovery/page-images/`.

## Voice

Warm, affirming, culturally-aware. "You Are Welcome Here." Bilingual (EN/ES). Serves immigrant &
BIPOC communities, Philadelphia + all-PA telehealth.
