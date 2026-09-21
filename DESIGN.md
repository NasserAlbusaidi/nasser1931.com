# Personal observatory — nasser1931.com

**Current direction:** Space-centric, requested 20 September 2026. Retains the previously approved personal homepage structure and real content.

## Experience

Nasser's personal home for work, cycling, notes, and reading. The opening pairs a large name and direct introduction on the left with a close view of Earth on the right. A small home-base annotation connects the orbital artwork to Muscat. A compact "In my orbit" strip leads into selected work. Native links and ordinary document scrolling keep everything directly accessible.

## Visual language

- Outfit for spacious display type and supporting text; system mono for navigation details, section numbers, and log labels. Literata remains for long-form article prose.
- Default dark: blue-black #080D16, surface #101824, text #EEF2F8, muted #A6B3C6, amber #E8BD85.
- Light alternative: lunar gray #EEF1F4, text #172337, muted #526077, bronze #8C5827. Preserve the saved `np-theme` preference. The image-led hero remains dark in both themes.
- Planetary artwork supplies the atmosphere. Use restrained rules and numbering around real content. No moving starfields, simulated telemetry, navigation puzzles, or compulsory animation.
- The homepage hero spans the full page width. Earth is an independently positioned transparent image, deliberately large and cropped at the outer edges; do not stretch a landscape image to fill the space. The introduction, home-base annotation, and caption stay in document flow, within the same centred content width and responsive gutters as the sections below. Grid layouts stack on narrow screens. All links have visible focus; reduced motion disables smooth scrolling.

## Artwork

`public/images/earth-orbit-v2.webp` (1254 × 1254) and `earth-orbit-v2-small.webp` (800 × 800) are transparent WebP exports of a single original built-in imagegen asset, generated 21 September 2026. The globe shows Africa and Arabia, oceans and clouds, a shadowed western limb, city lights, a blue atmosphere, and warm light at the upper right. It is a decorative Earth illustration, not a NASA photograph or navigation map. The homepage labels it "An imagined view of Earth" and uses empty alternative text. No pin claims to mark a precise location. The earlier orbital-horizon images remain as unused prior assets.

Generation prompt (built-in mode, one image): "A premium cinematic photorealistic-style illustration of Earth viewed from orbit. A complete spherical Earth centered in a square frame, occupying 88–92% of the canvas, on a genuine transparent background. Recognisable rich blue oceans, wispy ivory-white clouds, Africa, the Arabian Peninsula and the eastern hemisphere visible. Subtle night-side city lights, realistic spherical geometry and detailed natural texture. Left third in deep shadow; narrow electric-blue atmospheric rim; restrained warm sunrise on the upper-right limb. Natural navy, cyan, ivory, and restrained amber. Complete uncropped globe, natural circular silhouette, transparent margin outside its atmosphere. Earth only: no surrounding stars, text, rings, spacecraft, gridlines, HUD, logos, floor, cast shadow or panels. Decorative illustration, not scientific or navigational imagery. One image, no variants."

## Content and routes

- Work: `/builds`; Notes: `/stupidshit`; Life: `/field`; Reading: `/reading`.
- Preserve `/paper`, `/coach`, existing article URLs, collections, RSS, and sitemap.
- Rihla leads the homepage work section, with its groups, events, and shared-expense features and an explicit in-progress status. Research is omitted from the homepage for now; The Silent Creep remains available at `/paper` and in the project archive.
- Work uses a project-log layout: Rihla, Coach engine, and Einstein's Travel Bureau receive detailed features; the remaining tools form a compact catalogue, followed by published and paused work in the archive. Preserve every inventory entry, the dated statuses, and source links. Use text and spacing to extend the observatory theme without repeating the homepage hero.
- The coach feature uses the same canonical engine and dated snapshot as `/coach`.
- Reading uses a dated StoryGraph CSV import and links to the profile; do not label it automatic or live. Private tags and reviews are not site content. Cycling and reading use committed snapshots with dates. Avoid invented activities, book reviews, project statuses, or reading totals. No Nedd claim without supporting content.
- Notes uses a spacious journal index, with the actual latest entry featured. Life leads with the last recorded ride, the trailing seven-day totals, and the available recent sessions, followed by field notes. Do not imply the capped activity snapshot is a complete training history.
- Reading uses a current-book feature, totals from the imported shelf, planned books, and a finished list grouped by year. Preserve partial dates and the undated group; do not invent covers, progress, or reviews.
- The coach is a working surface: compact introduction, four date controls, then recommendation and recorded signals side by side. Keep the snapshot/projection distinction, engine overrides, and manual calendar command. Its engine and source data remain unchanged.
- Entry pages and the archived paper use large Outfit headings and a readable Literata prose column. Preserve paper figures, tables, metadata, sharing, and editing log. The 404 page uses the same type, colors, and a direct route home.

## Implementation

`src/pages/index.astro` and `src/styles/home.css` own the homepage. `src/pages/builds/index.astro` and `src/styles/work.css` own the Work page. `PageIntro`, `EntryIndex`, and `interior.css` support Notes, Life, and Reading; Reading and Coach have dedicated stylesheets. `global.css` contains shared themes and type. Preserve Astro, npm, Firebase, the lockfile, and all existing sync workflows. Generated paper markdown and figures must not be hand-edited. Local design edits do not imply publication.
