# Design System — nasser1931.com

**Name:** Field Journal
**Status:** v0.1 — locked 2026-04-26

## Product Context

- **What this is:** A personal site for a writer-engineer-triathlete in Muscat. The flagship is a rigorous N=1 long-form field report (the paper). Surrounding it: a blog, a `/field` log of small achievements (training milestones, race results, hinge moments), a `/stupidshit` folder for one-off oddities, a reading list, and an about page.
- **Who it's for:** Curious readers who'd otherwise be on Gwern, Tom MacWright, Maggie Appleton, Robin Sloan, Patrick Collison. Friends. Future Nasser.
- **Space / industry:** Long-form personal sites — the writer-researcher quadrant of the personal-web. Adjacent peers above.
- **Project type:** Editorial / personal site with data-presentation needs. Static build (Astro + React islands). Future scope is open-ended — anything that fits a personal site and is unmistakably *this* person's.

## Aesthetic Direction

- **Direction:** Field Journal — editorial-personal with print-rooted typography. A researcher's notebook that fell open on the table: hand-tuned warmth, typesetter's discipline.
- **Decoration level:** Intentional. Texture comes from typography choices and warm cream paper, not ornaments. No gradients, no decorative blobs, no purple, no centered-everything.
- **Mood:** Serious craft underneath, warm voice on top. Should feel like one person made it on purpose. Visitor leaves thinking "yup, that's Nasser alright."
- **Reference sites considered:** macwright.com (category nav, density, dated lists), thesephist.com (warm prose, hand-stitched links), maggieappleton.com (cream background, self-deprecating voice, mixed content types), robinsloan.com (signature color as identity), patrickcollison.com (categories-as-personality).

## Typography

Four typefaces, four jobs. All free, all from Google Fonts.

| Role | Family | Weights | Notes |
|------|--------|---------|-------|
| Display / H1 / H2 | **Fraunces** | 400, 500, 600, 700 (variable, optical sizing 9–144) | Headlines feel writerly. Use `font-variation-settings: "opsz" 96` for hero; `"opsz" 36` for section heads. |
| Body / long-form prose | **Source Serif 4** | 400, 500, 600, 700 (variable, optical sizing 8–60) | Paper, blog, stupidshit prose. Old-style figures (`onum`) on by default for prose; switch to lining for tabular contexts. |
| UI / nav / labels / buttons | **Geist** (sans) | 400, 500, 600 | Tabular numerals built in. Used for nav, buttons, eyebrows in non-mono contexts. |
| Data / numbers / code / achievements | **Geist Mono** | 400, 500 | All numeric content uses mono with `font-feature-settings: "tnum"`. Race results, training stats, dates in body, code blocks, stat callouts, eyebrow labels. Treats numbers as first-class. |

**Loading:** Single Google Fonts `<link>` in `BaseHead`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
```

**Type scale**

| Token | Size | Line height | Family | Letter-spacing |
|-------|------|-------------|--------|----------------|
| `display-hero` | clamp(56px, 8vw, 96px) | 0.95 | Fraunces opsz 144, w600 | -0.025em |
| `h1` | 44px | 1.05 | Fraunces opsz 96, w600 | -0.02em |
| `h2` | 32px | 1.2 | Fraunces opsz 48, w600 | -0.01em |
| `h3` | 22px | 1.3 | Fraunces opsz 36, w600 | normal |
| `body-lg` | 19px | 1.55 | Source Serif 4 w400 | normal (italic for subtitles) |
| `body` | 17px | 1.65 | Source Serif 4 w400 | normal |
| `body-sm` | 15px | 1.55 | Source Serif 4 w400 | normal |
| `ui` | 14px | 1.5 | Geist w400/500 | normal |
| `ui-sm` | 12px | 1.4 | Geist w400/500 | normal |
| `eyebrow` | 11px | 1.4 | Geist Mono w500 | 0.18em (uppercase) |
| `mono` | 14px | 1.5 | Geist Mono w400 | normal (`tnum` on) |
| `mono-sm` | 12px | 1.4 | Geist Mono w400 | normal (`tnum` on) |

**Rules**

- Hero `h1` only on home and paper. Other pages start at `h2`.
- Italic for subtitles, blockquotes, and titles of works inline.
- `<code>` inline: rust-on-soft-rust pill (see Color).
- Link underlines always present, never on `:hover` only. `text-underline-offset: 3px; text-decoration-thickness: 1px;`
- Numbers in prose use mono — race times, weights, watts, distances, dates. Words around them stay serif.

## Color

**Approach:** restrained — one signature accent + warm neutrals. Color is rare and meaningful.

### Light (default)

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#FAF7F2` | Page background. Warm cream, "aged paper." |
| `--surface` | `#F4F0E8` | Card / inset surface. Slightly darker than bg. |
| `--ink` | `#1A1714` | Body text. Deep ink, not pure black. |
| `--muted` | `#6B655C` | Secondary text, dates, captions. |
| `--rule` | `#E5DED2` | Hairlines, borders, separators. |
| `--accent` | `#B85C1F` | Rust / burnt sienna. Links, the family name in the hero, eyebrow accents, primary buttons, blockquote rule. |
| `--accent-soft` | `#F2DDC9` | Inline `code` background, ghost button hover. |

### Dark

Warm tobacco — not cool gray, not pure black. Same accent hue, reduced saturation.

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#1A1610` | |
| `--surface` | `#221E17` | |
| `--ink` | `#E8E0D2` | |
| `--muted` | `#968D7E` | |
| `--rule` | `#2E2920` | |
| `--accent` | `#C97442` | |
| `--accent-soft` | `#3A2A1C` | |

**Theme strategy:** CSS variables driven by `html.dark` class. JS toggle persists to `localStorage` (`np-theme`). Default respects `prefers-color-scheme` on first visit.

**Semantic colors (used sparingly):**

| Token | Hex (light) | Hex (dark) | Role |
|-------|-------------|------------|------|
| `--success` | `#5A7A3F` | `#9DBE7F` | Race finishes, PRs, "this survived check N." |
| `--warning` | `#A87515` | `#D9A862` | Retraction notices, soft-warnings. |
| `--error` | `#A93724` | `#D8624D` | Hard retractions, failed checks. |
| `--info` | `#3F6B7A` | `#7FB3C5` | Footnotes, reproducibility callouts. |

Semantic colors do not appear in nav, body prose by default, or as accents — only on bordered callout blocks. The accent rust does the work everywhere else.

## Spacing

- **Base unit:** 4px.
- **Density:** comfortable. Long-form prose gets generous breathing room (1.65 line-height, 18–24px between paragraphs).

| Token | px | rem |
|-------|-----|-----|
| `2xs` | 2 | 0.125 |
| `xs` | 4 | 0.25 |
| `sm` | 8 | 0.5 |
| `md` | 16 | 1 |
| `lg` | 24 | 1.5 |
| `xl` | 32 | 2 |
| `2xl` | 48 | 3 |
| `3xl` | 64 | 4 |
| `4xl` | 96 | 6 |
| `5xl` | 128 | 8 |

## Layout

- **Approach:** hybrid. Disciplined column for prose; sidebar text-nav on home/section pages; figures break out of the prose column to full-bleed.
- **Container widths:**
  - `--col-prose` 680px — for paper, blog posts, long entries.
  - `--col-wide` 1040px — for component grids, home page with sidebar nav.
  - `--col-figure` 1100px — figure breakout max.
- **Grid:** no rigid 12-column system. Flexbox / CSS grid as needed; consistency comes from the spacing scale.
- **Border radius:**
  - `radius-sm` 2px
  - `radius-md` 4px (default — buttons, chips, code pills)
  - `radius-lg` 6px (cards, mockup containers)
  - `radius-full` 9999px (avatars only; rare)
- **Hairlines:** 1px `var(--rule)` everywhere. Never thicker.

## Motion

- **Approach:** minimal-functional. Motion clarifies state changes; it never decorates.
- **Easing:** `ease-out` (enter), `ease-in` (exit), `ease-in-out` (symmetric / theme toggle).
- **Duration:**
  - `micro` 50–100ms (hover color shift, link underline thicken)
  - `short` 150–250ms (button press, focus ring fade)
  - `medium` 250–400ms (theme toggle cross-fade)
  - `long` 400–700ms (rare; only for figure-load reveals if needed)
- **Disallowed:** page transitions on navigation, scroll-jacking, parallax, decorative bounces, full-page loading spinners. Future interactive figures use `short` snappy easing — no decorative bounce on data interactions.

## Categories (information architecture)

The site is organized by what kind of thing each entry is, not by chronology:

- **paper** — the long-form field report (currently one). Full editorial treatment.
- **blog** — essays, in-depth posts that don't fit the paper.
- **field** — training milestones, race results, hinge moments. Short entries; mono-heavy stat blocks.
- **stupidshit** — one-off oddities, weird hacks, jokes that warrant a permanent URL.
- **reading** — books finished, with star rating + date.
- **about** — who this is, where to find me.

## Component principles

- **Buttons:** primary (rust fill), secondary (outlined ink), ghost (rust text on hover-fill). Never gradient, never shadowed, never bubbly.
- **Cards:** rare. Most lists are date-right `<li>` rows — denser, less generic.
- **Figures:** always wrapped in `<figure>` with bold-prefix `<figcaption>` ("Figure N." in `--ink`, rest in `--muted`). Full-bleed against the prose column.
- **Tables:** mono headers (uppercase, 0.1em tracking, muted), serif body cells, mono right-aligned numeric columns with tabular nums.
- **Blockquote:** 2px rust left rule, italic, muted color, no quotation marks.
- **Inline code:** rust text on `--accent-soft` pill, mono.
- **Code block:** mono, surface background, rule border, 4px radius.

## Anti-patterns (explicit)

Banned across the site:

- Purple/violet gradients
- 3-column icon-in-circle feature grids
- Centered everything
- Uniform bubbly border-radius
- Generic gradient buttons
- Generic stock-photo hero sections
- Marketing copy patterns ("Designed for X", "Built with love")
- Dark mode that's pure black `#000000`
- Pure white `#FFFFFF` background
- Sans-serif body for the paper or any long-form prose
- "Loading..." spinners on static content

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-26 | Initial design system created (Field Journal v0.1) | Replaces Astro blog template defaults. Cream + rust + Fraunces/Source Serif/Geist/Geist Mono. Locked after preview review. |
| 2026-04-26 | All numeric content uses Geist Mono with tnum | Treats numbers as first-class data; matches paper's rigor; differentiates from generic dev personal sites. |
| 2026-04-26 | Categories: paper, blog, field, stupidshit, reading, about | "field" and "stupidshit" added per user spec — site needs to honor both rigor and personality without picking sides. |
| 2026-04-26 | Reference sites: macwright (nav), maggie/robin (warmth + identity), patrickcollison (categories) | Layered synthesis from competitive research, April 2026. |
