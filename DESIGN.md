# Design System — nasser1931.com

**Name:** Splits
**Status:** v1.0 — drafted 2026-07-18. Supersedes Press v0.2 (Fraunces masthead, newsprint cream, signal red) and Field Journal v0.1 before it.
**Concept:** A race timing sheet. The site of a man who logs everything — splits, watts, kilograms, commits. Black figures on white paper, one hi-vis marker yellow, condensed caps like a start list taped to a wall. The data is the identity; there is no costume.

**The founding constraint:** v1.0 exists to kill the recognizable AI-designed aesthetic. Press v0.2 was fluent 2026 machine-editorial — Fraunces 900 masthead, tracked-out mono eyebrows, cream + signal red, `№ 001` numbering, drop caps, "Nº 1 · Vol. 1 · A quarterly" cosplay. Every one of those tells is banned below. When in doubt, choose the move a template would never make: system fonts, pure white, a highlight instead of a colored link, a table instead of a card.

## Product Context

- **What this is:** A personal site for an engineer-triathlete in Muscat. Flagship: a rigorous N=1 field report (`/paper`). Around it: `/field` (race results, milestones), `/stupidshit` (oddities), `/reading` (books), `/coach` (daily cycling briefing), and a live training pulse on the home page.
- **Who it's for:** Curious readers, friends, future Nasser.
- **Space:** Personal-web, writer-researcher quadrant — but styled from *his* world (race bibs, finish clocks, results sheets, intervals.icu), not from publishing.
- **Project type:** Astro 6 static build + Firebase Hosting.

## Aesthetic Direction

- **Direction:** Timing-sheet utilitarian. The vernacular of race results: dense tables, heavy top rule, condensed caps, tabular numbers, one flag color per state.
- **Decoration level:** Near zero. The only ornament is the marker-yellow highlight, and it always means "this is active / this matters."
- **Mood:** Fast, honest, slightly severe. A wall printout, not a magazine.
- **Reference points (conceptual):** finish-line timing boards, TdF broadcast lower-thirds, Swiss federal-railway signage, the printed start list at a local triathlon. Personal-web kin: danluu's speed, gwern's density — but with visual confidence.

## Typography

Two webfonts (self-hosted via Fontsource), two system stacks. No font CDNs.

| Role | Family | Loading | Notes |
|------|--------|---------|-------|
| Display — wordmark, page titles, section heads, big stats | **Barlow Condensed** 500/600/700 | `@fontsource/barlow-condensed/{500,600,700}.css` | Highway-signage grotesque. Caps for titles and labels. AI design never reaches for condensed faces — that's the point. |
| Long-form prose (`/paper`, entries) | **Literata** (variable) | `@fontsource-variable/literata` `index.css` + `wght-italic.css` | Designed for long screen reading (Google Play Books). CSS family name: `'Literata Variable'`. |
| UI / body text everywhere else | **system-ui stack** | none | `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Zero load, zero costume. |
| Code, aligned data columns | **system mono stack** | none | `ui-monospace, "SF Mono", Menlo, Consolas, monospace`. Never tracked out, never uppercase. |

**Type patterns**

| Token | Spec |
|-------|------|
| `wordmark` | Barlow Condensed 700, lowercase, 26–30px, tracking -0.01em |
| `title-hero` (home paper title, page H1) | Barlow Condensed 700 caps, clamp(48px, 8vw, 110px), line-height 0.9, tracking -0.01em |
| `title-page` (section index H1) | Barlow Condensed 700 caps, clamp(40px, 6.5vw, 84px), line-height 0.9 |
| `label` (column headers, block labels) | Barlow Condensed 600 caps, 13px, tracking 0.05em, `--muted`. **This replaces the eyebrow. Never mono, never 0.18em tracking.** |
| `stat-big` | Barlow Condensed 700, clamp(30px, 4vw, 52px), line-height 1 |
| `prose` | Literata 19px / 1.72 (16.5px on mobile) |
| `body` | system sans 15px / 1.55 |
| `data` | system mono 13px, `tnum` on, lowercase |

**Rules**

- Headings and labels are caps in Barlow Condensed. Everything else is sentence case. No small-caps, no letter-spacing above 0.06em anywhere.
- Links are ink-colored with a 1.5px underline (`text-underline-offset: 3px`). Hover paints the marker (`background: var(--mark)`). Links are never a brand color.
- Numbers in data contexts use the mono stack with `tnum`. Big display numbers use Barlow Condensed.
- No drop caps. No italic-muted deks. Italic is for emphasis and titles-of-works only.

## Color — Marker on White

One highlight, three flags, no tints.

### Light (default)

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#FFFFFF` | Pure white. Deliberately — warm off-whites are the machine default now. |
| `--surface` | `#F4F4F1` | Code blocks, inset panels. |
| `--ink` | `#111111` | Text, rules, the header bar. |
| `--muted` | `#6B6B6B` | Secondary text, dates. |
| `--rule` | `#E4E4E1` | Hairlines. |
| `--mark` | `#FFE81C` | **Marker yellow.** Hover fills, active rows, the highlighted word, selection. Always carries `--on-mark` text. |
| `--on-mark` | `#111111` | Text on the marker, both modes. |

### Dark

| Token | Hex |
|-------|-----|
| `--bg` | `#0F0F0E` |
| `--surface` | `#191917` |
| `--ink` | `#F1F1ED` |
| `--muted` | `#98988F` |
| `--rule` | `#2A2A27` |
| `--mark` | `#F5DF1E` |
| `--on-mark` | `#111111` |

**Flags** (coach states, warnings — solid chips with `#111111` text, both modes):

| Token | Hex | Role |
|-------|-----|------|
| `--flag-green` | `#2FBE56` | GREEN state, PRs, passes |
| `--flag-amber` | `#FFC933` | AMBER state, warnings |
| `--flag-red` | `#FF5A45` | RED state, failures |

No `color-mix` pastel tints. A state is a solid flag chip or a 3px border — never an 8%-opacity wash.

**Theme strategy:** unchanged mechanics — CSS variables on `html.dark`, FOUC-safe boot in `BaseHead`, localStorage key `np-theme`.

## Spacing & Layout

- **Base unit:** 4px. Densities: prose breathes (1.72), tables pack (10–12px row padding).
- **Containers:** `--col-prose` 720px · `--col-wide` 1200px · `--col-figure` 1080px.
- **The bar:** every page opens with the header ending in a **3px solid `--ink` rule** — the one heavy stroke, like the top of a results sheet. All other rules are 1px `--rule` (or 1px `--ink` for table heads).
- **Border radius: 0. Everywhere.** Square chips, square buttons, square code blocks.
- **Tables over cards.** Lists are full-width rows with hairline separators; hovering a linked row floods it with `--mark`.
- **Wordmark:** `nasser1931` lowercase (the domain is the name). No "NASSER / ALBUSAIDI" nameplate, no issue numbers, no colophon.

## Motion

- Hover fills: 60–80ms ease-out (feel instant).
- One entrance moment site-wide: the marker highlight behind the featured word on the home title wipes in once (~400ms, `transform: scaleX`, left-origin). Nothing else animates on load.
- `prefers-reduced-motion`: all transitions/animations off.
- Banned: parallax, scroll-jacking, page transitions, count-up numbers, decorative micro-motion.

## Components

- **Header:** one row — wordmark left, nav right (Barlow Condensed 600 caps 14px) + theme toggle; 3px ink bar below. Active nav item sits on a `--mark` chip.
- **Pulse strip (home):** full-width row of big Barlow Condensed numbers (hours · TSS · TSB · last session), hairline-divided columns, `label` captions, "updated Xh ago" in mono. Reads like a live timing board.
- **Results table (indexes, home log):** `label`-style column headers over hairline rows: date (mono) | title (Barlow Condensed 600, 20–22px) | meta. Linked rows flood `--mark` on hover. No fake entry numbers.
- **Buttons:** square, 1px `--ink` border, ink text; hover floods `--mark`. Primary variant: solid `--ink` with `--bg` text. Never colored, never rounded, never shadowed.
- **Flag chip:** solid flag color, `#111` text, Barlow Condensed 600 caps 13px, square.
- **Inline code:** `--surface` background, `--ink` text, mono. Not colored.
- **Code block:** `--surface`, 1px `--rule` border, radius 0.
- **Blockquote:** 3px solid `--ink` left rule, regular (not italic, not muted) Literata.
- **Figures (paper):** breakout to `--col-figure`, 1px rule above; captions Literata 14px `--muted`, "Figure N." in 600 weight, no italics.
- **Footer:** one mono line — location, github, rss, source. Unchanged content.

## Anti-patterns — the AI-tell blacklist

Banned across the site. Most of these were Press v0.2; that's why it's gone.

- Fraunces, Instrument Serif, Space Grotesk, Playfair, Inter-as-identity — the 2025–26 AI font rotation
- Warm cream/off-white page backgrounds (`#F8F5EE` and kin)
- An "accent color" applied to links, eyebrows, and buttons alike
- Tracked-out uppercase mono microlabels (the eyebrow)
- Editorial cosplay: mastheads, issue numbers, colophons, "Nº", "Vol.", drop caps, deks
- `№ 001` fake entry numbering
- Pastel state tints via `color-mix(... 8–14%, transparent)`
- Border-radius on anything
- Icon-in-circle grids, gradient anything, glassmorphism, purple
- Cards where a table row would do
- Marketing copy patterns; cutesy self-aware framing ("the back of the book")
- Google Fonts / Fontshare CDN links (fonts are self-hosted or system)

## Categories (information architecture)

Unchanged: **paper** (flagship report) · **field** (dated log) · **stupidshit** (oddities) · **reading** (shelves) · **coach** (daily briefing). The home page is a board: pulse strip, the paper as lead item, recent log rows, reading line.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-26 | Field Journal v0.1 created. | Initial system. Cream + rust + refined Fraunces. |
| 2026-05-15 | Press v0.2 — full rebrand. | Print-quarterly concept; Fraunces pushed chunky; signal red. |
| 2026-05-16 | `/coach` added as fifth section. | intervals.icu-driven daily briefing. |
| 2026-07-18 | **Splits v1.0 — full rebrand, brief: "drop the Claude signature."** | Press v0.2 read as recognizably AI-designed (Fraunces + cream + signal red + mono eyebrows is the 2026 machine-editorial fingerprint). Replaced with race-timing vernacular native to the owner: Barlow Condensed + Literata + system stacks, pure white/near-black, marker-yellow highlight, tables over cards, radius 0. |
| 2026-07-18 | Links are ink + underline; color only as highlight/flag. | A single accent coloring links, buttons and labels is itself a template tell. Highlight-on-hover is the ownable move. |
| 2026-07-18 | Fonts self-hosted via Fontsource; UI/mono are system stacks. | Kills font-CDN links, speeds first paint, and system-stack UI text is a hand-built signal. |
| 2026-07-18 | Wordmark is the domain, lowercase: `nasser1931`. | The site is named what it's called. Retires the two-line nameplate cosplay. |
