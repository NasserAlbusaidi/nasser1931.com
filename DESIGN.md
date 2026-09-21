# Personal observatory — nasser1931.com

**Current direction:** Space-centric, requested 20 September 2026. Retains the previously approved personal homepage structure and real content.

## Experience

Nasser's personal home for work, cycling, notes, and reading. The opening pairs a large name and direct introduction on the left with a complete Arabia-facing Earth on the right. The home-base caption sits below the illustration, separate from its geography. On phones, the full globe sits below the text and links. A compact current-project and reading strip leads into selected projects. Native links and ordinary document scrolling keep everything directly accessible.

## Visual language

- Outfit for spacious display type and supporting text; self-hosted IBM Plex Mono 400 for labels and log details. Seven shared type tokens define labels (14px), body (16px), lead (20px), card titles (24px), headings (40px), display (64px), and hero (104px), with smaller display steps at responsive breakpoints. Eyebrows are muted, uppercase, 0.08em tracked mono across every page. Literata remains for long-form article prose.
- Default dark: blue-black #080D16, surface #101824, text #EEF2F8, muted #A6B3C6, amber #E8BD85.
- Light alternative: lunar gray #EEF1F4, text #172337, muted #526077, bronze #8C5827. Preserve the saved `np-theme` preference. The hero follows the selected theme. CSS and color-scheme metadata both default to dark; the saved preference updates the class, metadata, native controls, and the toggle action label. The outlined theme button uses the same treatment in both modes.
- Planetary artwork supplies the atmosphere. Use restrained rules around real content. No decorative section, card, or list numbers; preserve meaningful dates, counts, the 1931 brand, and authored research numbering. No moving starfields, simulated telemetry, navigation puzzles, or compulsory animation.
- The homepage hero spans the page width with a shared 1360px content container, 32px desktop gutters and 20px mobile gutters. Earth stays completely in frame, with transparent margins and no text overlay. Below 900px, the globe follows the copy in document order. The header, content, and footer share a grid. Compact standalone links and controls provide at least 44px targets. Internal links use →, back links ←, external destinations ↗. All links have visible focus; reduced motion disables smooth scrolling.

## Artwork

`src/assets/earth-arabia.png` is a 1254 × 1254 transparent illustration generated with built-in imagegen on 21 September 2026. It faces the Arabian Peninsula with Oman, the Horn of Africa, Iran, and India visible. Astro Picture serves AVIF/WebP widths 400, 640, 960, and 1254. Complete sphere, blue atmosphere, warm dawn, no rectangular background or clipped limbs. The artwork is illustrative, not a precise map or NASA photograph; no pin claims scientific location accuracy. The caption reads "An imagined view of Earth, facing Arabia" and the decorative image has empty alt text. Earlier Earth assets are unused prior versions.

`ProjectPreview.astro` renders authentic screenshots from `src/assets/projects/`: two Rihla demo screens (shared-expense ledger and settlement) and Einstein's actual travel desk. `sources.json` records the pinned official-repository source URLs and provenance. Rihla screenshots contain seeded demo data and are captioned accordingly. The published study's existing figure is reused without altering the generated source. All previews use Astro Image, responsive WebP variants, dimensions, descriptive alt text, and lazy loading.

## Content and routes

- Projects: `/builds`; Notes: `/stupidshit`; Life: `/field`; Reading: `/reading`.
- Preserve `/paper`, `/coach`, existing article URLs, collections, RSS, and sitemap.
- Rihla leads with verified App Store and Google Play links, with the repository as a secondary link. The Silent Creep and Einstein’s Travel Bureau are featured on the homepage. Welcome posts remain at their original URLs but are not promoted on the homepage. Show five real books, beginning with current reading.
- Projects uses a project-log layout: Rihla, The Silent Creep, Einstein’s Travel Bureau, and Coach engine receive detailed features. The remaining tools form a compact catalogue. Use specific labels from builds.json and verified destinations, without a redundant year column or blanket Live status. Bite is intentionally MIT open source. All selected projects use the same surface and border treatment in both themes. Rihla, the study, and Einstein include real visuals. Home features lead with project names at the same title size. Use text and spacing to extend the observatory theme without repeating the homepage hero.
- The coach feature uses the same canonical engine and dated snapshot as `/coach`.
- Reading uses a dated StoryGraph CSV import and links to the profile; do not label it automatic or live. Private tags and reviews are not site content. Cycling and reading use committed snapshots with dates. Avoid invented activities, book reviews, project statuses, or reading totals. No Nedd claim without supporting content.
- Notes uses a spacious journal index, with the actual latest entry featured. Life leads with the last recorded ride, the trailing seven-day totals, and the available recent sessions, followed by field notes. Do not imply the capped activity snapshot is a complete training history.
- Reading uses a current-book feature, totals from the imported shelf, planned books, and a finished list grouped by year. Preserve partial dates and the undated group; do not invent covers, progress, or reviews.
- Real published covers appear on the homepage and throughout Reading. `src/data/book-covers.json` records explicit title-and-author matches, verified image dimensions, and source/edition provenance independently of the StoryGraph snapshot, so reimports retain the cover catalog. These are representative English editions, not claimed exact audiobook/print editions. Open Library images use their direct cover URLs per their public-display guidance; author and publisher sources fill verified gaps. Covers load lazily, reserve their space, keep all artwork visible, and have a clear missing-image state. Adjacent titles provide the accessible text; decorative cover images use empty alt text. Keep source credits below the shelf.
- The public coach is read-only: a recommendation and four-day outlook. User chose not to display daily HRV, RHR, sleep, or form. Build-time public-coach.mjs allowlists output fields; never serialize source data, diagnostic reasoning, warnings, DSL, or operator controls. Future days use the established moderate-recovery baseline. Rest days are compact dated rows; structured sessions retain expandable detail. Only positive finite workout targets render, and dates use the same weekday/day/month style. The original source snapshots remain in public Git history; this is not a claim of repository privacy. Remove the legacy pulse form classifier; recovery interpretation belongs to the coach engine.
- Entry pages and the archived paper use large Outfit headings and a readable Literata prose column. Preserve paper figures, tables, metadata, sharing, and editing log. The 404 page uses the same type, colors, and a direct route home.

## Implementation

`src/pages/index.astro` and `src/styles/home.css` own the homepage. `src/pages/builds/index.astro` and `src/styles/work.css` own the Projects page. `PageIntro`, `EntryIndex`, and `interior.css` support Notes, Life, and Reading; Reading and Coach have dedicated stylesheets. `global.css` contains shared themes and type. Preserve Astro, npm, Firebase, the lockfile, and all existing sync workflows. Generated paper markdown and figures must not be hand-edited. Local design edits do not imply publication.

## Sharing and identity

The site is a personal home for a senior software engineer, with Projects as the navigation label and the owner-supplied LinkedIn link in the footer. Keep space language to the observatory and Earth artwork; avoid repeated slogans and location labels. Homepage social art is generated; the five section previews use reproducible Outfit typography via `npm run generate-og`. Articles use their own image when one exists and otherwise omit inherited images. `robots.txt` points to the sitemap.
