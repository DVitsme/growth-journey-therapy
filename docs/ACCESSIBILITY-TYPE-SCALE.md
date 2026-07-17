# Accessible type scale — decision record

The primary user is a 65+ woman with vision difficulty; the site must still read as normal to a
30-year-old. Three research passes (aging/low-vision reading science, WCAG 2.2 standards, and
practical GOV.UK/USWDS-style scales) converged on one answer, applied here.

## The decision

- **Root font-size `118.75%` → 19px** (`app/globals.css`, `html`). A *percentage*, not a fixed px, so
  it **multiplies** the user's own browser default rather than overriding it (WCAG 1.4.4 Resize Text).
  This lifts the whole rem system — type, spacing, and hit-targets — to a senior-friendly base.
- **Body 19px / line-height 1.6**, matching what **GOV.UK (`govuk-body` 19px)** and **NHS.UK** ship to
  their entire all-ages populations — mainstream, not "large print."
- **Type scale via `@theme` token overrides** (so every existing `text-sm`/`text-lg`/… utility is
  corrected at once): body 19 · lead 22 · h4 25 · h3 30 · h2 38 · h1 47px, with tightening line-heights.
- **16px hard floor.** `--text-xs` is aliased *up* to ~16px, so even an accidental `text-xs` renders at
  the floor. All hardcoded `text-[13px]`/`text-[15px]`-style sizes were converted to scale utilities.
- **Reading columns capped at ~66 characters** (`max-w-prose`) — long lines are hard for this audience.
- **Targets ≥44px** (WCAG 2.5.5 AAA) — buttons and nav links clear this after the root lift.
- **Contrast fix:** muted-on-green text `#d9e5df → #eef4f1` (4.07:1 → 4.73:1, now passes WCAG AA).
  All other brand pairs already pass AA (body ink 14.3:1, muted ink 7.1:1, greens ~5.3:1).
- **Hero display headings** are capped (not scaled with the body) so they fit their fixed-aspect images.

## Why this serves both audiences

Reading speed *plateaus* for good vision above ~16px, so a younger reader is indifferent to the
increase, while an older/low-vision reader sits on the steep part of the curve and gains measurably.
"Large" for a 20-year-old is merely "adequate" for a 70-year-old.

## Sources

- NIA "Making Your Website Senior Friendly"; NN/g Usability for Senior Citizens
- Systematic review of font size for older adults (Frontiers/PMC 2022); Legge & Bigelow critical-print-size
- WCAG 2.2: 1.4.3/1.4.6 Contrast, 1.4.4 Resize Text, 1.4.10 Reflow, 1.4.12 Text Spacing, 2.5.5/2.5.8 Target Size
- GOV.UK Design System type scale; NHS digital service manual typography; USWDS font-size tokens
- WCAG Technique C14 (em/rem for text); Josh Comeau & CSS-Tricks on px vs rem accessibility
