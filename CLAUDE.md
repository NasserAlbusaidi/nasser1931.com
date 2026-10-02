# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# nasser1931.com

Personal home for software, racing, reading, and experiments. Astro static build, deployed to Firebase Hosting.

## Design System

Read **DESIGN.md** before visual changes. The current direction is a space-centric personal observatory, requested in September 2026. The homepage hero is a full-width three.js orrery: the sections as a solar system on near-black, edge to edge, with the intro copy laid over its left side and Solar System Scope textures (CC BY 4.0, credited in the caption). The static Earth stays as the poster and fallback (see Orrery below). The copy uses large Outfit display type, self-hosted IBM Plex Mono labels, seven shared type sizes, dark blue-black surfaces, and amber accents. Preserve the clear personal introduction and visible work, races, notes, and reading. Default to dark while honoring saved `np-theme`; the light alternative uses lunar gray. The hero stays dark space in the light theme, and its copy uses the dark palette. On phones (900px and below) the orrery follows the text as a full-bleed 3:2 canvas; never crop the system or place small copy over it (the card opens under it, and labels show section names only, beside the bodies and never on a sphere). Project screenshots come from the real apps, with source provenance recorded in src/assets/projects/sources.json. Decorative numbering is retired. See `src/pages/index.astro` and `src/styles/home.css`. Preserve existing data syncs, URLs (and the redirects for retired ones), and Firebase architecture.

## Stack

- **Framework:** Astro 6 (blog template, heavily customized).
- **Hosting:** Firebase Hosting.
- **Registrar:** AWS (domain bought there).
- **DNS:** Route 53.
- **Cert:** auto-issued by Google Trust Services.

## Critical gotcha — Firebase project ID

The Firebase project ID is **`nasser-portfolio`**, not `nasser1931`. A 2026-04-26 GCP project quota cap blocked creating a fresh `nasser1931` project, so the old unused `nasser-portfolio` project was reused. The custom domain `nasser1931.com` is attached to the `nasser-portfolio` site. Default URLs:

- `https://nasser-portfolio.web.app/` (Firebase default)
- `https://nasser-portfolio.firebaseapp.com/` (Firebase default)
- `https://nasser1931.com/` (custom)

`.firebaserc` reflects this — never change it back to `nasser1931` unless the GCP quota is freed and a new project is created.

## Commands

```bash
npm run dev                                          # local dev server, http://localhost:4321
npm test                                             # node --test over scripts/*.test.mjs (orrery, races, now feed, sky privacy, reading, redirects, importers, the hidden room)
npm run refresh-next-race                            # write the next intervals.icu race to src/data/next-race.json (needs INTERVALS_API_KEY + INTERVALS_ATHLETE_ID env vars)
npm run refresh-reading                              # fetch reading list from Notion, write src/data/reading.json (needs NOTION_TOKEN env var)
npm run sync-hardcover                               # pull the shelf + progress from Hardcover (needs HARDCOVER_TOKEN; HARDCOVER_TAKEOVER=1 to replace another source)
npm run cache-covers                                 # mirror every referenced cover into public/covers + src/data/cover-cache.json (needs open network)
npm run sync-posts                                   # fetch Published posts from Notion, write src/content/stupidshit/*.md (needs NOTION_TOKEN; defaults to known Posts db)
npm run generate-og                                  # regenerate the section cards in public/social/ (deterministic; re-run when the OG look or a section changes)
npm run add-photo -- <image> --title "…" --location "…" --exif-from <raw frame> [--stack <n|unknown>] [--alt "…"]  # add a /sky photo (see Sky below)
gh workflow run refresh-next-race.yml                # easier: run the same refresh on CI; commits + pushes only on diff
gh workflow run sync-reading.yml                     # manually trigger the Notion → /reading sync (also runs every 6h)
gh workflow run sync-posts.yml                       # manually trigger the Notion → posts sync (also runs every 30min)
gh workflow run sync-hardcover.yml                   # Hardcover → /reading sync + cover cache (also runs every 6h); add -f takeover=true once to switch from StoryGraph
npm run build                                        # static output to dist/
firebase deploy --only hosting --project nasser-portfolio  # manual ship (CI does this on push to main)
```

Google Search Console: `https://nasser1931.com/` is a URL-prefix property (added 28 September 2026), verified by the `google-site-verification` meta tag in `BaseHead.astro`. Keep that tag, or the property loses verification. The sitemap submitted there is `sitemap-index.xml`.

A redeploy is the easiest way to invalidate Fastly's edge cache if the site appears stale on the custom domain.

The dev server can keep serving an `.astro` component's old `<style>` block after an edit (seen twice on 28 September 2026; the OneDrive file watcher is the likely cause). After a style edit, confirm the served CSS changed before judging the result; if it did not, restart `npm run dev`.

## Deployment workflow

Repo: https://github.com/NasserAlbusaidi/nasser1931.com

- **Push to `main`** → GitHub Actions runs `npm ci && npm run build` and deploys to Firebase Hosting live channel (`nasser1931.com`). Runs share `concurrency.group: firebase-live-deploy`, so a slow older deploy can never land after a newer one. The bots deploy live inline from their own workflows (their `GITHUB_TOKEN` pushes do not trigger this one), so they are not in that group.
- **Open a PR** → Action deploys to a Firebase preview channel and posts the URL as a PR comment. Channel auto-expires after 7 days.
- Workflow files live in `.github/workflows/firebase-hosting-{merge,pull-request}.yml`. Secret: `FIREBASE_SERVICE_ACCOUNT_NASSER_PORTFOLIO`.

For one-off manual deploys, the legacy command above still works — useful for cache-busting Fastly without a code change (`firebase deploy --only hosting --project nasser-portfolio`).

## Site structure

```
src/
├── consts.ts                  ← SITE_TITLE, SITE_DESCRIPTION
├── pages/
│   ├── index.astro            ← home page: the orrery hero, "In orbit now", one section per planet, the sky closing
│   ├── builds/                ← /builds (Projects)
│   ├── races/                 ← /races: Mars and its moons, the build-up ladder, the race log
│   ├── stupidshit/            ← /stupidshit index + dynamic [...slug] route
│   ├── sky/                   ← /sky night-sky photos
│   ├── reading/               ← /reading
│   └── pluto.astro            ← /pluto, the hidden room (see Hidden room below)
├── content/
│   ├── stupidshit/            ← /stupidshit entries (zod schema: title, summary, date, optional tags[], optional notion_id)
│   └── sky/<slug>/            ← index.md + photo.jpg per sky photo (written by npm run add-photo)
├── layouts/
│   └── Entry.astro            ← layout for /stupidshit entries
├── components/
│   ├── Header.astro           ← nav: Projects / Notes / Races / Reading / Sky + theme toggle
│   ├── SkyClosing.astro       ← homepage closing line over the latest sky photo
│   ├── Orrery.astro           ← hero solar system: markup, hashed textures, hoisted boot script
│   ├── PlanetMark.astro       ← still of an orrery body (texture on a CSS sphere); section markers
│   ├── PlanetHeading.astro    ← homepage section heading: marker, "Body · Section", link
│   ├── RaceCard.astro         ← homepage races panel
│   ├── MarsSystem.astro       ← /races header: Mars with a moon per race
│   ├── RaceLadder.astro       ← /races build-up: races by distance raced, oldest first
│   ├── WorldsCard.astro       ← homepage series band (from reading-series.json + the shelf)
│   ├── Footer.astro
│   ├── BaseHead.astro
│   ├── HeaderLink.astro
│   ├── ThemeToggle.astro      ← light/dark toggle (FOUC-safe boot in BaseHead)
│   └── FormattedDate.astro
```

## Orrery

`Orrery.astro` is the hero background: it fills the `.introduction` section on desktop (height `clamp(680px, 100svh - 4.75rem, 960px)`), and the copy (`.intro-copy`) sits over it with `pointer-events: none` on the layer so a drag on empty space reaches the canvas. Below 900px the copy comes first and the orrery is a full-bleed 3:2 canvas under it, with the card, links, and caption in flow. It wraps the static Earth (`earth-arabia.png`, still `loading="eager" fetchpriority="high"`), which stays as the LCP poster and as the fallback when WebGL throws (logged with `console.error`), `prefers-reduced-motion` is set, or save-data is on. In those cases three.js is never downloaded. Otherwise `src/scripts/orrery/boot.ts` waits for `load` and for the hero to be near view, then dynamically imports the scene. The first canvas frame has the camera close on Earth, framed to the poster (same centre and diameter, Arabia facing us), and crossfades with it; the camera then pulls back over 3.6s to the rest view, and the orbits and spin start easing in only then. The orbit lines are invisible on the first frame and fade in over the pull-back, full strength at rest, so none sweeps across the copy (`fadeOrbits` in `stage.ts`); planets are not faded. Scene code lives in `src/scripts/orrery/`; the pure rules in `src/lib/orrery.ts` (tested by `scripts/orrery.test.mjs`).

- **Mapping:** Sun → `/`; Earth → Projects (`builds.json`; moons Rihla and Einstein); Mars → Races (`races.ts`; moons are the newest six races); the asteroid rock → Notes; Saturn → Reading (ring arc = progress through the series being read, from `buildReadingSeries` and Hardcover `progress`); Sky is the backdrop card, not a body. Every destination is also a plain link in the hero's bottom band (under the picture on phones).
- **Size:** `0.28 + 0.13·√count` (the Notes rock is fixed). **Speed:** `0.32·(0.14 + 0.86·e^(−days/45))` from days since the section's data last changed: `builds.json` `updated`, the newest race, the newest note, the newest sky photo, the newest full-dated finish on the shelf. It is computed in the browser against `Date.now()` so it stays honest between deploys. A source without a date drifts at the speed of `UNDATED_DAYS` (90); never invent a date.
- **Textures:** sources in `src/assets/orrery/` (JPG/PNG), served as WebP through `getImage` so they are hashed under `/_astro/`. Nothing goes un-hashed in `public/`, because `firebase.json` caches `.webp` for a year. Colour maps are `SRGBColorSpace`; the ring keeps its alpha channel.
- **Lights:** the mockup used r128's no-falloff lights; three r186 has only physical ones. `scene.ts` uses decay 0 with intensities scaled by π, then a slightly stronger sun and weaker ambient to match the approved look. If the look drifts after a three upgrade, retune there.
- **Camera:** hand-rolled orbit (the approved feel), `touch-action: pan-y` so a vertical swipe scrolls the page. `fitView` picks the distance and the sun's position from the projected bounds of the rest pose (every orbit sampled all the way round, Saturn's ring, moons, and labels included) and the width the copy covers (`.intro-copy`, measured in `stage.ts`): the sun sits in the middle of the free area, 60-75% across, and the projection is shifted with `setViewOffset` (not the scene), so drag and fly-to still turn around the sun. The rest camera looks down 30 degrees (`REST_ELEVATION_DEG`, up from 21) so the system is a rounder ellipse that fills more of the hero's height. Width, not height, sets the size on normal screens: Saturn can be at either side of its orbit, so its ring must fit beyond the orbit line there, and the outer orbit can take at most `orbit / (orbit + ring reach)` (about 78%) of the free width however the camera is tilted; only a smaller ring would change that. A body in focus is centred in the free area; while the card is laid over the canvas (wide screens) the body and its label go where the card leaves room (left of it, or above it in a narrow window) and the body is drawn smaller if it would not fit (`focusPlace` in `src/lib/orrery.ts`, fed the open card's corner by `stage.ts`). The fit counts what is drawn: a ringed body is fitted by its ring (`focusRadius`, 2.5 radii for Saturn), so Saturn's sphere is only about 40% of the room (about 175px at 1440) and its ring stays clear of the copy and the card; moons are not counted. The camera target rides along with the body's orbit and eases only the rest of the distance (`followStep`); easing towards its position alone left it trailing by more than the gap to the card. The static poster uses the same CSS geometry, so nothing moves when the canvas arrives. Earth is turned to face Arabia on the first frame; it keeps orbiting afterwards. Zoom is a multiplier on the fitted rest distance (0.4x to 2.5x in the overview, never inside a body in focus), so it survives a resize. Buttons (Overview, -, +), pinch, and ctrl/cmd + wheel zoom; a plain wheel scrolls the page. Overview, the card's close, Escape, and a double click or tap on empty space all return to the rest view; one click on empty space returns from a focused body, or opens the Sky card when nothing is focused. A double is two clicks within 500 ms and 32px (40px for a finger), decided before looking at what is under the second one, so a body that drifted under it after the first tap's fly-back cannot turn it into a pick. The Sky card therefore waits 520 ms after a single tap on empty space; a second tap inside that time cancels it. Labels avoid each other (the smaller or farther body gives way) and never sit on another body's sphere.

## Hidden room

`/pluto` is an easter egg, added 2 October 2026 at the owner's request: Pluto, the ninth body, demoted in 2006, so it gets no section, no nav link, and no orrery body. The page has `noindex, nofollow` (BaseHead's `noindex` prop) and the sitemap filter in `astro.config.mjs` leaves it out. Never add it to `robots.txt` (that advertises it), the nav, or the orrery. `scripts/pluto.test.mjs` checks all of that.

- **Ways in** (`WAYS` in `src/lib/pluto.mjs`, the pure rules, tested): the Konami code or typing "pluto" on any page (ignored while typing in a field or holding ctrl/cmd/alt), `pluto()` in the devtools console (a styled hint is logged on every page), nine clicks on the Sun in the orrery with no more than 2.5s between them (`stage.ts`), and the faint drifting dot on the 404 page (any `a[data-pluto-way]`). The triggers load on every page from a small script in `BaseHead.astro` (`src/scripts/pluto/`, about 3.5 kB).
- **Entering:** `enterRoom` in `src/scripts/pluto/warp.ts` plays a 0.9s canvas jump to light speed (none under reduced motion) and records the way in `sessionStorage`, so the URL stays plain. The room reads it once to say how you came in, and keeps the ways found in `localStorage` (`np-pluto-found`) to tick them off. A direct visit counts as no way.
- **Content:** a drawn Pluto (SVG: the pale heart, the dark equatorial band, blue haze), Charon, and the Sun as a bright star; the ways-in checklist with hints for the ones not found; a mailto ("I found Pluto"). The space panel keeps its dark palette in the light theme. Facts on the page are real (2006 reclassification; sunlight takes about five hours, 4.8 h at Pluto's 2026 distance). To add a way in, add it to `WAYS` and wire its trigger to `enterRoom(id)`.

## Retired sections

Removed on 27 September 2026 at the owner's request; see the redirects under firebase.json.

- **Life (`/field`) and the training pulse.** The ride snapshot, `HomePulse`, `training.json`, the `field` content collection, and the Life nav link are gone. Races moved to `/races`.
- **The Silent Creep (`/paper`).** The study, its figures, the paper log, and the `sync-paper` workflow are gone. The study stays private in `NasserAlbusaidi/project-furnace`. Do not re-add a sync from that repo without the owner asking.

## Layout details

`src/pages/index.astro`:
- Below the hero: the "In orbit now" feed (`src/lib/now-feed.mjs`, tested in `scripts/now-feed.test.mjs`), then one section per orrery body in orbit order, each headed by `PlanetHeading.astro`: Earth · Projects (Rihla with App Store, Google Play, and source links, then Einstein), Mars · Races (`RaceCard.astro`), Asteroid belt · Notes, Saturn · Reading (`ShelfSpines`, then `WorldsCard.astro`). Notes tagged `meta` (the welcome post) are never promoted, so the Notes section and its feed item appear only once a real note is published. Do not nest anchors.
- The page closes with `SkyClosing.astro`: the latest sky photo with the "Say hello" line and button on the dark sky, and the title, capture line, and "All photos" link below the image. With no sky photos it falls back to the plain closing note.

OG fallback image:
- `BaseHead.astro` maps the homepage and section routes to distinct images in `public/social/`. `npm run generate-og` regenerates the four section typography cards (projects, races, reading, notes). The homepage has generated Earth artwork. `/sky` uses its latest photo, passed from the page with `getImage`. Article pages use their own image when supplied and otherwise omit inherited images.

## DNS records (Route 53, hosted zone `nasser1931.com.`)

| Type | Name (apex) | Value | Purpose |
|------|-------------|-------|---------|
| A    | (empty)     | `199.36.158.100` | Firebase Hosting edge |
| TXT  | (empty)     | `"hosting-site=nasser-portfolio"` | Firebase ownership verification |

Both records must be at the apex. In Route 53, **leave the Name field empty** to mean apex — typing `nasser1931.com` causes Route 53 to append the zone, producing `nasser1931.com.nasser1931.com`.

`www.nasser1931.com` works: Firebase 301-redirects it to the apex (checked 28 September 2026). Its Route 53 record is not listed in the table above.

## The race bot

`scripts/refresh-next-race.mjs` writes `src/data/next-race.json` from intervals.icu RACE_A/B/C calendar events (name, date, priority, distance only; never the event description, which can hold private notes).

- **Refresh:** `.github/workflows/refresh-next-race.yml` runs on cron `0 */6 * * *` plus `workflow_dispatch`, and commits + deploys **only if the file changed**. A failed lookup fails the run; it does not overwrite the file.
- **Secrets (GitHub Actions):** `INTERVALS_API_KEY`, `INTERVALS_ATHLETE_ID`. Local credential mirror lives in `~/Desktop/Personal/Portfolio/.env` under the `VITE_INTERVALS_*` names — the script reads either prefix.
- **Concurrency:** the bots share `concurrency.group: bot-pushes-main` and `git pull --rebase origin main` before push, so two never race to push to main.
- **Commit author:** `race-bot <bot@nasser1931.com>`. Older `pulse-bot` commits in history are from the retired training pulse.

## The reading list

**Source: Hardcover (live since 26 September 2026).** `scripts/sync-hardcover.mjs` reads the user's library from the Hardcover GraphQL API (`HARDCOVER_TOKEN` secret, from hardcover.app/account/api) and writes `src/data/reading.json` with `source: "hardcover"`, adding `progress` (percent), `pages`, and `cover_url` to each book. `.github/workflows/sync-hardcover.yml` runs every 6h. It will not replace a snapshot owned by another source unless run once with `-f takeover=true` (`HARDCOVER_TAKEOVER=1`), it no-ops without a token, and it refuses to write an empty library. The same workflow runs `scripts/cache-covers.mjs`, which mirrors covers into `public/covers/` (400px WebP) and records dimensions plus a dominant colour in `src/data/cover-cache.json`. The cloud dev container cannot reach the cover hosts or Hardcover; both scripts run in CI.

**Fallback: StoryGraph CSV import for `nasser1931`.** Running it switches the snapshot's owner to StoryGraph, and the Hardcover sync then stops until it runs once with takeover. `scripts/import-storygraph.mjs` accepts an official export and writes the existing reading snapshot schema plus source metadata. Run `npm run import-storygraph -- <export.csv> nasser1931`. CSV files stay outside Git; private tags, reviews, and signed download links must never be committed. Import preserves year/month-only dates, and the pages use `formatReadingDate` so a year is not displayed as an invented January date. `ReadingSource.astro` identifies the export source and import date. This is not unattended live sync.

`refresh-reading.mjs` checks snapshot ownership before credentials or network calls and skips a non-Notion source. Do not remove that guard or reintroduce a rebasing bot push that could replay stale Notion changes over an imported snapshot. To intentionally return to Notion, explicitly switch the snapshot source as part of that task.

### Legacy Notion source

The previous `/reading` source used `src/data/reading.json`, synced from a Notion database (Reading List, db id `cc065a07385442afacf12561c8d7d425`).

- **Source schema (Notion):** Title (title), Author (text), Status (select: Reading | Want to Read | Finished | Dropped), Rating (select: 1–5 stars), Format (select: Audiobook | Physical | Kindle | PDF), Genre (multi_select), Started (date), Finished (date).
- **Sync:** `.github/workflows/sync-reading.yml` runs cron `0 */6 * * *` plus `workflow_dispatch`. It calls the Notion query API with `NOTION_TOKEN`, transforms each page into a flat `Book` record, sorts Finished by `Finished` date desc, and writes the snapshot. Idempotent — only commits + deploys when the snapshot diff is non-empty.
- **Page render:** `src/pages/reading/index.astro` reads the JSON, splits into Currently / Finished / Want to Read sections, and groups Finished by year. Ratings render as `N/5`; do not invent reviews or ratings.
- **Setup (one-time):** create an internal integration at notion.so/my-integrations, share the Reading List page with the integration, set `NOTION_TOKEN` as a GitHub secret on this repo. The script reads `NOTION_READING_DB` env var to override the database id if it ever changes; default is the known id.

## Writing posts from Notion (no-code authoring)

Posts on `/stupidshit` can be authored entirely in Notion — no commits, no IDE. The pipeline mirrors Published rows of a Notion database into markdown files in the stupidshit content collection on every sync.

- **Notion database schema (required columns):**
  - `Title` — title
  - `Summary` — rich_text (used for the index card blurb + meta description)
  - `Date` — date (drives sort + the filename prefix `<date>-<slug>.md`)
  - `Status` — select: `Draft` | `Published` (only `Published` rows are written; flipping to Draft removes the file on next sync)
  - `Collection` — select, optional. `field` is retired: such rows publish to `stupidshit` with a warning in the sync log.
  - `Slug` — rich_text, optional (auto-derived from Title if blank)
  - `Tags` — multi_select, optional
- **Body:** any Notion block content — paragraphs, headings (H1–H3), bulleted/numbered/toggle lists, to-dos, quotes, callouts (rendered as blockquotes with leading emoji), code blocks (language preserved), dividers, images, embeds, bookmarks. Rich-text annotations (bold, italic, strikethrough, inline code, links) are preserved.
- **Images:** Notion-hosted images expire on a ~1h signed URL, so the sync downloads each image to `public/posts/<slug>/<sha1>.<ext>` and rewrites the markdown to point at the stable local path. Captions become the alt text.
- **Posts database:** `https://www.notion.so/8274ed5c50304f20a598bf7bb30d7d3f` (Posts, db id `8274ed5c50304f20a598bf7bb30d7d3f`), sibling of Reading List under "🎯 Personal" — so the same internal integration that backs the reading-list sync already has access. The id is hardcoded as the default in `scripts/sync-posts.mjs`; `NOTION_POSTS_DB` env override only needed if it ever moves.
- **Sync workflow:** `.github/workflows/sync-posts.yml` runs cron `*/30 * * * *` plus `workflow_dispatch` plus `repository_dispatch[post-update]` (left wired for a future webhook). It calls `scripts/sync-posts.mjs` with `NOTION_TOKEN`, then commits + builds + deploys only when the diff is non-empty.
- **Reconciliation:** each generated file carries `notion_id: "<page uuid>"` in its frontmatter. On each sync the script scans the content dir for that field, builds a `notion_id → file` map, and:
  - rewrites the file in place when content changes
  - moves it (delete old, write new) when slug/date changes
  - deletes the file when the page is unpublished or removed in Notion
  Hand-authored markdown files without a `notion_id` are left alone — the two authoring modes coexist safely.
- **Concurrency:** shares the `bot-pushes-main` concurrency group with the other sync workflows; commit author is `posts-bot <bot@nasser1931.com>`.
- **Setup:** done once on 2026-05-15 — db created, integration access inherited from "🎯 Personal" parent, default db id baked into the script, `NOTION_TOKEN` already a GH secret. Day-to-day: open the Posts db in Notion, write a row, set Status=Published, then either wait ≤30min for cron or run `gh workflow run sync-posts.yml` to ship now.

## Sky

`/sky` shows night-sky photos from the `sky` content collection, newest first. Each entry is `src/content/sky/<date>-<place>/index.md` beside `photo.jpg`.

- **Adding a photo:** `npm run add-photo -- <finished image> --title "…" --location "…" --exif-from <one source RAW/JPG> [--stack <n|unknown>] [--alt "…"]`. Stacked TIFFs carry no capture data, so `--exif-from` reads date, camera, lens, and exposure from one source frame. The date is the camera-local day. The script copies camera and lens names as the EXIF writes them (`SONY ILCE-7M4`); tidy them in `index.md` by hand (`Sony α7 IV`).
- **Privacy:** the repository is public. The script re-encodes the image (3000px, JPEG) with no EXIF, XMP, or IPTC, and refuses to write if any metadata survives, so GPS and serial numbers never reach Git. `scripts/add-photo.test.mjs` covers this. Originals stay on `D:\Camera`; never commit RAW or TIFF files.
- **Honest captions:** exposure values describe one frame. `stack` is a recorded frame count, or `"unknown"` for a stack whose count was not kept; leave it out for a single exposure. Never invent a stack count, a location, or a place more precise than the owner gave. Alt text describes only what is visible.
- **Timelapse:** optional `timelapse.mp4` beside `index.md`, declared in frontmatter as `timelapse: { poster: ./poster.jpg, frames: <n> }`. The page resolves the file with `import.meta.glob`, so Vite hashes it into `/_astro/` (cached as immutable, like the other hashed assets), and the build fails if the frontmatter declares a timelapse with no file. The video shows under the photo with native controls, `preload="none"`, and no autoplay. The homepage stays a still photo. Build it from the processed frames, then strip metadata: `ffmpeg -framerate 24 -i final2_%03d.tif -vf scale=1920:-2:flags=lanczos -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -an out.mp4`, then `ffmpeg -i out.mp4 -c copy -map_metadata -1 -movflags +faststart timelapse.mp4`. Export the poster from frame 1 with `exportPhoto` (1920px) so playback starts without a jump. The page serves the poster as one 1280px WebP (about 120 kB): it loads with the page, and at 1920px it held back the photo on phones (Lighthouse mobile 89 → 97). The first photo carries `fetchpriority="high"`. `scripts/video-metadata.test.mjs` fails if any committed MP4 carries a location (`©xyz`, `loci`) or XMP. The caption states only the frame count; 24 fps is a render choice, not a capture fact.
- **Images:** pages serve WebP only. AVIF doubled the size of star fields with no visible gain (checked 28 September 2026).
- **Order:** `newestFirst` in `src/lib/sky.mjs` sorts both pages: newest night first, then slug order within a night. The night's main image keeps the plain `<date>-<place>` slug, so it stays first and stays on the homepage; single frames from the same night add the camera time (`--slug 2026-06-13-jabal-al-sarah-0030`).
- **Current photos:** three from 13 June 2026 on Jabal Al Sarah. Two are single-frame Lightroom edits, `10960613/DSC07921-Enhanced-NR-Edit.tif` (00:30) and `DSC08216-Edit.tif` (01:59), chosen by the owner on 30 September 2026. The main one: Milky Way over Jabal Al Sarah, 13 June 2026, from `D:\Camera\2026\June\output\final2.tif`, capture data from `10960613/DSC07921.ARW`. The stack count was not recorded. The owner also made a timelapse (posted on Instagram, 15 June); that file was not found on this PC, so the site's timelapse was rebuilt on 28 September 2026 from the 318 processed frames `output\final2_001.tif`–`final2_318.tif` (1920px, CRF 26, 24 fps, 13.25 s, 6.2 MB). The owner preferred it to the original.

## Races

The homepage Race log card and `/races` read two files. `src/data/races.json` is a curated record of past races with results taken from recorded intervals.icu activities (date, name, kind, distance, status finished/dnf/dns, total, splits). A swim/bike/run split may carry `km`, the course distance (or the distance actually covered, noted), which `src/lib/races.ts` turns into pace; watch GPS swim distances read short, so don't use them. The same module computes transition time, the stats strip, and PB tags (shown only once a race kind has two finishes). `RaceSplitBar.astro` draws the leg bar on both the card and `/races`. `/races` opens with `MarsSystem.astro` beside the intro (Mars with a moon per race, the newest six as in the orrery, orbit size from the square root of the km raced, tilted like the orrery's rest view) and `RaceLadder.astro` ("The build-up": every race oldest first, bar length = km raced, split by leg, with the gap since the race before). Both come from `src/lib/race-story.ts`, tested by `scripts/race-story.test.mjs`; km raced is the sum of the legs' recorded `km`, so a race with no leg km is left out of both rather than drawn at a guessed distance. Edit races.json by hand after a race; never invent times or placings. `src/data/next-race.json` is written by the race bot (see below). The countdown is recomputed in the browser so it doesn't go stale between deploys. `/coach` and its engine, snapshots, and workflow were removed on 23 September 2026 (Project Furnace replaced them); `firebase.json` 301-redirects `/coach` to `/races`.

## firebase.json

`dist` is the public dir. Caching headers:
- `*.html` → `max-age=0, must-revalidate` (always fresh)
- `*.{js,css,webp,avif,woff2}` → `max-age=31536000, immutable` (Astro's hashed assets)

`cleanUrls: true` means `/races` works (no `.html` suffix needed). `trailingSlash: false` 301s `/races/` to `/races`, so `astro.config.mjs` sets `trailingSlash: 'never'` and the RSS feed passes `trailingSlash: false`; canonical, sitemap, and feed URLs then point at the served page, not a redirect. `scripts/redirects.test.mjs` checks both settings.

Redirects (all 301, one hop, checked by `scripts/redirects.test.mjs`): `/field`, `/field/**`, `/coach`, `/coach/**` → `/races`; `/paper`, `/paper/**` → `/builds`. Add a row to that test when you retire a route.

