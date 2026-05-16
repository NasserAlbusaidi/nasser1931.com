# Design System — nasser1931.com

**Name:** Press
**Status:** v0.2 — drafted 2026-05-15. Supersedes Field Journal v0.1 (cream-on-ink + rust + Fraunces refined).
**Concept:** Pretend the site is a quarterly publication of one person. Home page = current issue cover. Paper = lead feature. Field / stupidshit = front matter & dispatches. Reading = back-of-the-book shelf. Training pulse = standings page. **Loud on the masthead, disciplined in the prose.**

## Product Context

- **What this is:** A personal site for a writer-engineer-triathlete in Muscat. The flagship is a rigorous N=1 long-form field report (the paper). Surrounding it: a `/field` log of training milestones, race results, and hinge moments; a `/stupidshit` folder for one-off oddities; a `/reading` list; a training pulse on the home page.
- **Who it's for:** Curious readers who'd otherwise be on Gwern, Tom MacWright, Maggie Appleton, Robin Sloan, Patrick Collison. Friends. Future Nasser.
- **Space / industry:** Long-form personal sites — the writer-researcher quadrant of the personal-web. The redesign deliberately pushes toward the *magazine-quarterly* corner of that space rather than the *understated-tasteful-blog* corner.
- **Project type:** Editorial / personal site with data-presentation needs. Astro 6 static build + Firebase Hosting.

## Aesthetic Direction

- **Direction:** Press — print-magazine-quarterly. Editorial confidence on the cover, reader-respect inside.
- **Decoration level:** Intentional — full-bleed horizontal rules, drop caps, mono marginalia, asymmetric mastheads. No gradients, no textures, no ornaments.
- **Mood:** A quarterly with one reader. Theatrical sectioning. Each visit is "this issue." The cover shouts; the articles whisper.
- **Reference sites:** worksinprogress.co (color-block sectioning, magazine-on-web), craigmod.com (paper warmth, dated lists), robinrendle.com (metadata-as-design), realreview.org (cover confidence), patrickcollison.com (categories-as-personality).

## Typography

Four typefaces, four jobs. All free.

| Role | Family | Weights | Notes |
|------|--------|---------|-------|
| Display — masthead, hero, section heads | **Fraunces** | 700, 800, 900 (variable, opsz 9–144) | Pushed into **chunky / industrial mode**. Always set `font-variation-settings: "opsz" 9, "SOFT" 0, "WONK" 0` on big display — gives newsprint slab feel, not Didone contrast. For in-article H2 use opsz 36, wght 800. Italic at lighter weights for emphasis. |
| Body — nav, lists, blurbs, cards | **Switzer** | 400, 500, 600, 700 | Söhne-adjacent without the price. Loaded via Fontshare CDN. Replaces Geist. |
| Long-form prose (paper only) | **Source Serif 4** | 400, 500, 600 (variable, opsz 8–60) | Retained from Field Journal — the one v0.1 asset worth keeping. Old-style figures (`onum`) on by default in prose; lining figures only in tabular contexts. |
| Data, numbers, code, marginalia | **JetBrains Mono** | 400, 500, 600 | Replaces Geist Mono. Sharper, more code-coded. All numeric content uses mono with `font-feature-settings: "tnum"`. |

**Loading:** one Google Fonts `<link>` + one Fontshare `<link>` in `BaseHead`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=JetBrains+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap">
```

**Type scale**

| Token | Size | Line height | Family | Variation / weight | Tracking |
|-------|------|-------------|--------|--------------------|----------|
| `display-hero` | clamp(56px, 9vw, 108px) | 0.85 | Fraunces | opsz 9, wght 900, SOFT 0 | -0.04em |
| `display-feature` | clamp(48px, 6.5vw, 88px) | 0.95 | Fraunces | opsz 9, wght 900, SOFT 0 | -0.02em |
| `h1` | clamp(40px, 5vw, 64px) | 1 | Fraunces | opsz 9, wght 900, SOFT 0 | -0.02em |
| `h2` (in-article) | 32px | 1.2 | Fraunces | opsz 36, wght 800, SOFT 0 | -0.01em |
| `h3` | 22px | 1.15 | Fraunces | opsz 14, wght 700, SOFT 0 | -0.005em |
| `dek` (cover sub-title) | 22px | 1.4 | Source Serif 4 italic w400 | — | normal |
| `body-lg` (paper) | 19px | 1.65 | Source Serif 4 w400 | onum on | normal |
| `body` (paper) | 18px | 1.65 | Source Serif 4 w400 | onum on | normal |
| `body-ui` | 15px | 1.5 | Switzer w400 | — | normal |
| `ui` | 14px | 1.5 | Switzer w400/500 | — | normal |
| `ui-sm` | 12px | 1.4 | Switzer w400/500 | — | normal |
| `eyebrow` | 11px | 1.4 | JetBrains Mono w500/600 | uppercase | 0.18em |
| `colophon` | 11px | 1.5 | JetBrains Mono w400/600 | uppercase | 0.06–0.14em |
| `mono` | 14px | 1.5 | JetBrains Mono w400 | tnum on | normal |
| `mono-sm` | 12px | 1.4 | JetBrains Mono w400 | tnum on | normal |
| `stat-big` | clamp(28px, 4vw, 48px) | 1 | Fraunces | opsz 9, wght 900, SOFT 0 | -0.01em |

**Rules**

- Display hero only on home and `/paper`. Other pages start at h1.
- "Fraunces wght 900 / opsz 9 / SOFT 0" is the **signature lockup**. Anything more refined (opsz 144) is reserved only for italic emphasis inside long-form prose.
- Italic Source Serif 4 for: cover deks, blockquotes, titles of works inline.
- Link underlines always present, never hover-only. `text-underline-offset: 3px; text-decoration-thickness: 1px;`
- Numbers in prose use mono — race times, weights, watts, distances, dates. Surrounding words stay serif.
- Drop caps on the first paragraph of `/paper` articles only: Fraunces wght 900 / opsz 9 / SOFT 0, 5.2em, color `--accent`, floated left, 8px 12px 0 0 padding.
- `<code>` inline: `--accent` text on `--accent-soft` pill, JetBrains Mono.

## Color — Newsprint Red

**Approach:** restrained — one signature accent + warm neutrals. Color is rare and meaningful.

### Light (default)

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#F8F5EE` | Page background. Newsprint cream — slightly cooler than Field Journal's. |
| `--surface` | `#EFEAE0` | Card / inset surface. Slightly darker than `--bg`. |
| `--ink` | `#15110D` | Body text. Warm carbon, not pure black. |
| `--muted` | `#6F6A60` | Secondary text, dates, captions. |
| `--rule` | `#DDD5C6` | Hairlines, borders, separators. |
| `--accent` | `#C8311C` | **Signal red.** Magazine-cover red. Links, the issue-number colorway, eyebrows used as section identifiers, primary buttons, blockquote rule, drop cap, the second line of the nameplate. |
| `--accent-soft` | `#F3DCD6` | Inline `code` background, ghost-button hover, alert backgrounds. |

### Dark

Warm carbon — not cool gray, not pure black. Same accent hue, slightly desaturated.

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#14110C` | |
| `--surface` | `#1C1812` | |
| `--ink` | `#ECE5D6` | |
| `--muted` | `#948C7E` | |
| `--rule` | `#2A251D` | |
| `--accent` | `#E0533F` | |
| `--accent-soft` | `#3A1E17` | |

**Theme strategy:** CSS variables driven by `html.dark` class. JS toggle persists to `localStorage` (`np-theme`). Default respects `prefers-color-scheme` on first visit. (Same FOUC-safe boot as Field Journal — keep `BaseHead.astro`'s inline init script intact.)

**Semantic colors** (used sparingly, callouts only — the accent red does the work everywhere else):

| Token | Hex (light) | Hex (dark) | Role |
|-------|-------------|------------|------|
| `--success` | `#5A7A3F` | `#9DBE7F` | Race finishes, PRs, "this survived check N." |
| `--warning` | `#A87515` | `#D9A862` | Retraction notices, soft-warnings. |
| `--error` | `#A93724` | `#D8624D` | Hard retractions, failed checks. |
| `--info` | `#3F6B7A` | `#7FB3C5` | Footnotes, reproducibility callouts. |

## Spacing

- **Base unit:** 4px.
- **Density:** *Two densities*. Long-form prose breathes (1.65 line-height, 18–24px between paragraphs). Indexes and TOCs pack tight (14px row padding, 1px rules).

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

- **Approach:** hybrid. Cover-page composition on home & section indexes. Disciplined prose column inside `/paper` and entries. Figures break out wider than the prose column.
- **Container widths:**
  - `--col-prose` 720px — `/paper`, blog-style posts, long entries.
  - `--col-wide` 1240px — home page magazine cover, section index pages.
  - `--col-figure` 1100px — figure breakout max.
- **Magazine masthead lockup** (home + every section index):
  - 4px solid `--ink` rule on top, 2px solid `--ink` rule on bottom, ~18px / 14px padding.
  - Nameplate left: Fraunces opsz 9 / wght 900 / SOFT 0, clamp(56px, 9vw, 108px), tracking -0.04em, line-height 0.85. Two lines: "NASSER" + "ALBUSAIDI" with the second line in `--accent`.
  - Colophon right: JetBrains Mono 11px uppercase, tracking 0.06em–0.14em — `Nº 12`, month + year, city, volume.
- **Cover grid (home only):** 2fr / 1fr — feature article (lead = `/paper`) on the left, aside on the right (front matter / currently reading / training pulse).
- **TOC pattern (field, stupidshit, reading):** 56px `№ NNN` num column / 1fr title+summary / auto date column. 1px `--rule` borders between rows, 14px vertical padding, mono num + date.
- **Border radius:** narrow. `radius-sm` 2px (buttons, chips, code pills, inputs). `radius-md` 4px (cards, alerts). No round corners. No `radius-full`.
- **Hairlines:** 1px `--rule`. Section rules / mastheads: 2px `--ink`. Mastheads use the 4px-top + 2px-bottom asymmetric rule pair.

## Motion

- **Approach:** minimal-functional. Motion clarifies state changes; it never decorates.
- **Easing:** `ease-out` (enter), `ease-in` (exit), `ease-in-out` (theme toggle).
- **Duration:**
  - `micro` 50–100ms (hover color shift, link underline thicken)
  - `short` 150–250ms (button press, focus ring fade)
  - `medium` 250–400ms (theme toggle cross-fade)
  - `long` 400–700ms (rare; only for figure reveals)
- **Disallowed:** page transitions on navigation, scroll-jacking, parallax, decorative bounces, full-page loading spinners.

## Categories (information architecture)

The site is organized by *what kind of thing* each entry is, not by chronology:

- **paper** — the long-form field report. Full editorial treatment, masthead, drop cap, figure breakouts.
- **field** — training milestones, race results, hinge moments. Dense TOC index, dated, mono-heavy stat blocks.
- **stupidshit** — one-off oddities. Same TOC index pattern as field, lighter tags.
- **reading** — books, with star rating + date. Currently / Finished (by year) / Want to Read shelves.

(*blog* and *about* are retired — they were never built and don't fit the print-zine metaphor. /paper is the lead, /field is the front matter, /stupidshit is the back of the book.)

## Component principles

- **Buttons:** primary (red fill, `--bg` text), secondary (outlined ink), ghost (red on transparent, hover fills `--accent-soft`). 2px radius. Never gradient, never shadowed.
- **Masthead lockup:** see Layout. Used at the top of home and every section index. Issue number is the unifying device.
- **Cards:** rare. Most lists are TOC-style rows with num / title / summary / date columns.
- **Drop cap:** on the first paragraph of `/paper` only. Fraunces 900 / opsz 9 / SOFT 0, 5.2em, color `--accent`, floated left.
- **Figures:** wrapped in `<figure>` with `<figcaption>` — "Figure N." bolded ink, rest muted. Break out of the prose column to `--col-figure`.
- **Tables:** mono headers (uppercase, 0.16em tracking, muted), Source Serif 4 body cells inside `/paper`, Switzer body cells elsewhere, mono right-aligned numeric columns with tabular nums.
- **Blockquote:** 2px solid `--accent` left rule, italic Source Serif 4, `--muted` color, no quotation marks.
- **Inline code:** `--accent` text on `--accent-soft` pill, JetBrains Mono.
- **Code block:** JetBrains Mono, `--surface` background, 1px `--rule` border, 2px radius, 20–24px padding.
- **Eyebrow:** JetBrains Mono 11px / 0.18em tracking / uppercase / `--muted` (or `--accent` when used as a section identifier).
- **Pulse block (home):** mono frame, `--surface` inset, ink rule top + dotted divider, big Fraunces 900/9 stat numbers, mono labels. `FRESH` tag in `--accent`-on-`--accent-soft`.
- **Stat callout:** 4-column grid, 1px `--rule` top, Fraunces 900/9 numbers, JetBrains Mono unit suffix and label.

## Anti-patterns (explicit)

Banned across the site:

- Purple / violet gradients
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
- Soft Didone-contrast display (the new face is *chunky*, not refined — no opsz > 36 on display headlines)
- Rust orange `#B85C1F` — retired with Field Journal v0.1
- Geist sans — retired (replaced by Switzer)
- Geist Mono — retired (replaced by JetBrains Mono)
- Fraunces at its default `SOFT` / `WONK` settings on display — always explicit `SOFT 0, WONK 0`

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-26 | Field Journal v0.1 created. | Initial design system. Cream + rust + Fraunces refined. Replaced Astro blog template defaults. |
| 2026-04-26 | Numeric content all in mono (`tnum`). | Treats numbers as first-class data; matches the paper's rigor. Carried forward in v0.2. |
| 2026-04-26 | Categories: paper, blog, field, stupidshit, reading, about. | Honors both rigor and personality. v0.2 retires blog + about. |
| 2026-05-15 | **Press v0.2 — full rebrand of v0.1.** | User itched for fresher. Field Journal was tasteful; v0.2 trades tasteful for theatrical. Print-zine-quarterly concept won the brief. |
| 2026-05-15 | Display: Fraunces retained but pushed to wght 900 / opsz 9 / SOFT 0. | Reuses existing bundle; one variable-font-axis change gives a completely different identity (chunky / industrial vs. refined Didone). Cheapest big-effect lever available. |
| 2026-05-15 | Body: Switzer replaces Geist. | Söhne-adjacent without the price. Less tech-coded than Geist. Fontshare CDN, free. |
| 2026-05-15 | Mono: JetBrains Mono replaces Geist Mono. | Sharper, more distinctive, still readable. Google Fonts CDN. |
| 2026-05-15 | Long-form: Source Serif 4 retained. | The one Field Journal asset worth keeping; engineered for screen long-form. |
| 2026-05-15 | Accent: signal red `#C8311C` replaces rust `#B85C1F`. | Magazine-cover red. Iconic editorial accent (Wired / Real Review / Penguin Modern Classics). High commitment, big payoff. |
| 2026-05-15 | Magazine masthead lockup adopted on home + every section index. | Cover-as-identity. Nameplate + colophon + issue number is the unifying device. |
| 2026-05-15 | `/blog` and `/about` retired from the IA. | Never built; don't fit the print-zine metaphor. Field + stupidshit cover the "blog" use case. |
| 2026-05-15 | Considered alternates: Bodoni Moda + General Sans + IBM Plex Mono (Vogue); EB Garamond (Penguin Classics); Boska + Synonym (brutalist art-zine); Instrument Serif (soft modern). | All declined in favor of "Fraunces pushed" — lowest switching cost, same print-zine confidence. |
| 2026-05-15 | Considered alternates: Ultramarine blue accent; alpine green accent. | Declined in favor of signal red as the higher-commitment editorial choice. |
