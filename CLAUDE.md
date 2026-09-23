# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# nasser1931.com

Personal home for software, cycling, reading, and experiments. Astro static build, deployed to Firebase Hosting. The field report at `/paper` connects the work and training tracks.

## Design System

Read **DESIGN.md** before visual changes. The current direction is a space-centric personal observatory, requested in September 2026. The homepage uses original fictional planetary artwork, a full Arabia-facing Earth, large Outfit display type, self-hosted IBM Plex Mono labels, seven shared type sizes, dark blue-black surfaces, and amber accents. Preserve the clear personal introduction and visible work, cycling, notes, and reading. Default to dark while honoring saved `np-theme`; the light alternative uses lunar gray. On phones the globe follows the text; never crop the sphere or place small copy over it. Project screenshots come from the real apps, with source provenance recorded in src/assets/projects/sources.json. Decorative numbering is retired. See `src/pages/index.astro` and `src/styles/home.css`. Preserve existing data syncs, URLs, generated paper content, and Firebase architecture.

## Stale sibling docs — don't trust as source of truth

- `TODO.md` is a session-handoff from 2026-04-26. All P0/P1 items in it have long since shipped. Ignore unless cleaning it up.

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
npm run dev:paper                                    # dev + chokidar watcher syncing the paper + figures from ProjecrFurnance
npm run sync-paper                                   # one-shot mirror of the paper + figures from ProjecrFurnance
npm run refresh-pulse                                # fetch latest training data from intervals.icu, write src/data/training.json (needs INTERVALS_API_KEY + INTERVALS_ATHLETE_ID env vars)
npm run refresh-reading                              # fetch reading list from Notion, write src/data/reading.json (needs NOTION_TOKEN env var)
npm run sync-hardcover                               # pull the shelf + progress from Hardcover (needs HARDCOVER_TOKEN; HARDCOVER_TAKEOVER=1 to replace another source)
npm run cache-covers                                 # mirror every referenced cover into public/covers + src/data/cover-cache.json (needs open network)
npm run sync-posts                                   # fetch Published posts from Notion, write src/content/{stupidshit,field}/*.md (needs NOTION_TOKEN; defaults to known Posts db)
npm run generate-og                                  # regenerate src/assets/og-fallback.jpg (one-shot; re-run when the OG look changes)
gh workflow run refresh-pulse.yml                    # easier: run the same refresh on CI; commits + pushes only on diff
gh workflow run sync-paper.yml                       # manually trigger the project-furnace → /paper sync (also runs every 30min, plus instant via webhook from project-furnace)
gh workflow run sync-reading.yml                     # manually trigger the Notion → /reading sync (also runs every 6h)
gh workflow run sync-posts.yml                       # manually trigger the Notion → posts sync (also runs every 30min)
gh workflow run sync-hardcover.yml                   # Hardcover → /reading sync + cover cache (also runs every 6h); add -f takeover=true once to switch from StoryGraph
npm run build                                        # static output to dist/
firebase deploy --only hosting --project nasser-portfolio  # manual ship (CI does this on push to main)
```

A redeploy is the easiest way to invalidate Fastly's edge cache if the site appears stale on the custom domain.

## Deployment workflow

Repo: https://github.com/NasserAlbusaidi/nasser1931.com

- **Push to `main`** → GitHub Actions runs `npm ci && npm run build` and deploys to Firebase Hosting live channel (`nasser1931.com`).
- **Open a PR** → Action deploys to a Firebase preview channel and posts the URL as a PR comment. Channel auto-expires after 7 days.
- Workflow files live in `.github/workflows/firebase-hosting-{merge,pull-request}.yml`. Secret: `FIREBASE_SERVICE_ACCOUNT_NASSER_PORTFOLIO`.

For one-off manual deploys, the legacy command above still works — useful for cache-busting Fastly without a code change (`firebase deploy --only hosting --project nasser-portfolio`).

## Site structure

```
src/
├── consts.ts                  ← SITE_TITLE, SITE_DESCRIPTION
├── pages/
│   ├── index.astro            ← home page, features Rihla and the race log
│   ├── paper/
│   │   └── index.md           ← /paper (synced from endurance-license/study.md)
│   ├── field/                 ← /field index + dynamic [...slug] route
│   ├── stupidshit/            ← /stupidshit index + dynamic [...slug] route
│   └── reading/               ← /reading stub
├── content/
│   ├── field/                 ← /field entries (zod schema: title, summary, date, optional stats {swim,bike,run,total,power,hr,distance}, optional notion_id)
│   └── stupidshit/            ← /stupidshit entries (zod schema: title, summary, date, optional tags[], optional notion_id)
├── layouts/
│   ├── Entry.astro            ← shared layout for /field + /stupidshit entries
│   └── Paper.astro            ← long-form layout for /paper
├── components/
│   ├── Header.astro           ← nav: Projects / Notes / Life / Reading + theme toggle
│   ├── Footer.astro
│   ├── BaseHead.astro
│   ├── HeaderLink.astro
│   ├── ThemeToggle.astro      ← light/dark toggle (FOUC-safe boot in BaseHead)
│   └── FormattedDate.astro
public/
└── paper/
    └── figures/               ← PNG figures (synced from endurance-license/figures/)
```

## The paper

Single-source paper rendered at `/paper`.

- **Source of truth:** `NasserAlbusaidi/project-furnace` (private repo) at `paper/endurance-license/study.md` plus its sibling `figures/` directory. **Canonical edit flow: commit + push to project-furnace; CI auto-syncs to this repo.** Do NOT hand-edit `src/pages/paper/index.md` — it's a generated artifact and will be overwritten by the next sync.
- **Auto-sync:** `.github/workflows/sync-paper.yml` runs every 30 minutes (cron `*/30 * * * *`), plus `workflow_dispatch` and `repository_dispatch[paper-update]` (left wired for a future webhook from project-furnace if 30min lag is too slow). It checks out project-furnace via the `PAPER_REPO_SSH_KEY` deploy key, runs `sync-paper` + `refresh-paper-log`, then commits + builds + deploys *only when the diff is non-empty*. Frontmatter (title, subtitle, byline, eyebrow, OG image) is hard-coded in `scripts/sync-paper.mjs`.
- **Editing log:** Visible at the foot of `/paper`. The 8 most recent commits to `paper/**` in project-furnace, sourced from `src/data/paper-log.json` (written by `scripts/refresh-paper-log.mjs`). The byline gets a "last edited Xh ago · N commits this week" stamp; the paper editing log retains its relative timestamp. All relative timestamps recompute in the browser from `data-iso` so static HTML doesn't show a stale build-time value.
- **Local fallback (offline editing):** `npm run sync-paper` still works against `~/Desktop/Personal/ProjecrFurnance` (which is a local clone of project-furnace). Use this for previewing changes before pushing — but the canonical publish path is push-to-project-furnace, not local sync + commit-here.
- **Concurrency:** sync-paper, refresh-pulse, and sync-reading all share `concurrency.group: bot-pushes-main` so the three bots never race to push to main. Each also `git pull --rebase origin main` before push as belt-and-suspenders.
- **Webhook from project-furnace:** `.github/workflows/notify-site.yml` lives in project-furnace and fires `repository_dispatch[paper-update]` to this repo on every push that touches `paper/**`. That cuts sync latency from up-to-30min to ~10s. Auth is via `SITE_DISPATCH_TOKEN` secret in project-furnace, currently set to a copy of the user's gh CLI token (full repo+workflow scope). For a tighter security posture, swap for a fine-grained PAT scoped to nasser1931.com only with Actions:write — but for a solo private repo this is fine.

Workflow (local, mostly for offline editing):

```bash
npm run dev:paper        # astro dev + watcher; figure changes in local ProjecrFurnance auto-sync and HMR-reload
npm run sync-paper       # one-shot sync of the paper + figures from local ProjecrFurnance
npm run refresh-paper-log  # rebuild src/data/paper-log.json from local ProjecrFurnance git log
PAPER_SOURCE=/some/other/path npm run sync-paper  # override the source dir
gh workflow run sync-paper.yml  # easier: run the same sync on CI; commits + pushes only on diff
```

## Layout details

`src/layouts/Paper.astro`:
- Reading column: 720px max-width, 1.05rem / 1.7 line-height (long-form prose).
- Figures break out wider via `figure { margin-left: 50%; transform: translateX(-50%); width: min(var(--container-figure), calc(100vw - 2.5rem)); }` (`--container-figure` is 1080px).
- Captions render via `<figcaption>` styled italic gray; the `Figure N.` prefix is bolded.
- All section H2s have `margin-top: 2.4em` for clear section breaks.

`src/pages/index.astro`:
- The homepage features Rihla with separate App Store and Google Play links plus a secondary source link. The race card (`RaceCard.astro`) uses one link; do not nest anchors. The Silent Creep and Einstein’s Travel Bureau are also featured.

Share button (Paper layout):
- `Paper.astro` ships an inline-JS share button under the prose. Uses `navigator.share()` when available, falls back to `navigator.clipboard.writeText()` with a "link copied" status. Disable per-page by passing `share: false` in frontmatter.

OG fallback image:
- `BaseHead.astro` maps the homepage and section routes to distinct images in `public/social/`. `npm run generate-og` regenerates the five section typography cards. The homepage has generated Earth artwork. Article pages use their own image when supplied and otherwise omit inherited images.

## DNS records (Route 53, hosted zone `nasser1931.com.`)

| Type | Name (apex) | Value | Purpose |
|------|-------------|-------|---------|
| A    | (empty)     | `199.36.158.100` | Firebase Hosting edge |
| TXT  | (empty)     | `"hosting-site=nasser-portfolio"` | Firebase ownership verification |

Both records must be at the apex. In Route 53, **leave the Name field empty** to mean apex — typing `nasser1931.com` causes Route 53 to append the zone, producing `nasser1931.com.nasser1931.com`.

`www.nasser1931.com` is **not configured**. Visitors typing `www` will fail. To add: re-add the custom domain in Firebase with the "redirect www → apex" option, or add a manual record in Route 53.

## The training pulse

The home page renders a dated ride summary, and `/field` (Life) renders the last recorded ride, trailing seven-day totals, and the available recent sessions using HomePulse, sourced from `src/data/training.json`. The JSON is a committed snapshot — visitors get whatever was last pushed. `last_ride` is picked from a 30-day activity window, separately from the capped `recent` list, so a run of gym sessions can't make the site claim there was no ride. The same script writes `src/data/next-race.json` from intervals.icu RACE_A/B/C calendar events (name, date, priority, distance only; never the event description).

- **Source:** intervals.icu API (which is fed by Garmin → intervals.icu sync).
- **Refresh:** `.github/workflows/refresh-pulse.yml` runs on cron `0 */6 * * *` plus `workflow_dispatch`. The script (`scripts/refresh-pulse.mjs`) fetches the last 14 days of activities + wellness, writes `src/data/training.json`, and the workflow commits + pushes **only if the snapshot diff is non-empty** — so quiet days don't trigger a redeploy.
- **Form translation:** TSB = CTL − ATL. `> +5` → `fresh`, `−10..+5` → `neutral`, `< −10` → `fatigued`. Standard TrainingPeaks bands.
- **Component:** `src/components/HomePulse.astro` renders trailing seven-day hours/TSS and recorded form, plus a recent-session disclosure that starts open. Keep the absolute snapshot date visible; a `data-snapshot` span adds relative age in the browser. The recent list is capped, not the full training history.
- **Secrets (GitHub Actions):** `INTERVALS_API_KEY`, `INTERVALS_ATHLETE_ID`. Local credential mirror lives in `~/Desktop/Personal/Portfolio/.env` under the `VITE_INTERVALS_*` names — the script reads either prefix.
- **Manual refresh:** `gh workflow run refresh-pulse.yml` is the simplest path. Locally you can also `bash -c 'set -a; source ~/Desktop/Personal/Portfolio/.env; set +a; npm run refresh-pulse'`.
- **The pulse-bot commit author** (`pulse-bot <bot@nasser1931.com>`) is harmless — these commits are auto-generated and only ever touch `src/data/training.json`.

## The reading list

**Target source: Hardcover.** `scripts/sync-hardcover.mjs` reads the user's library from the Hardcover GraphQL API (`HARDCOVER_TOKEN` secret, from hardcover.app/account/api) and writes `src/data/reading.json` with `source: "hardcover"`, adding `progress` (percent), `pages`, and `cover_url` to each book. `.github/workflows/sync-hardcover.yml` runs every 6h. It will not replace a snapshot owned by another source unless run once with `-f takeover=true` (`HARDCOVER_TAKEOVER=1`), it no-ops without a token, and it refuses to write an empty library. The same workflow runs `scripts/cache-covers.mjs`, which mirrors covers into `public/covers/` (400px WebP) and records dimensions plus a dominant colour in `src/data/cover-cache.json`. The cloud dev container cannot reach the cover hosts or Hardcover; both scripts run in CI.

**Until the takeover: StoryGraph CSV import for `nasser1931`.** `scripts/import-storygraph.mjs` accepts an official export and writes the existing reading snapshot schema plus source metadata. Run `npm run import-storygraph -- <export.csv> nasser1931`. CSV files stay outside Git; private tags, reviews, and signed download links must never be committed. Import preserves year/month-only dates, and the pages use `formatReadingDate` so a year is not displayed as an invented January date. `ReadingSource.astro` identifies the export source and import date. This is not unattended live sync.

`refresh-reading.mjs` checks snapshot ownership before credentials or network calls and skips a non-Notion source. Do not remove that guard or reintroduce a rebasing bot push that could replay stale Notion changes over an imported snapshot. To intentionally return to Notion, explicitly switch the snapshot source as part of that task.

### Legacy Notion source

The previous `/reading` source used `src/data/reading.json`, synced from a Notion database (Reading List, db id `cc065a07385442afacf12561c8d7d425`).

- **Source schema (Notion):** Title (title), Author (text), Status (select: Reading | Want to Read | Finished | Dropped), Rating (select: 1–5 stars), Format (select: Audiobook | Physical | Kindle | PDF), Genre (multi_select), Started (date), Finished (date).
- **Sync:** `.github/workflows/sync-reading.yml` runs cron `0 */6 * * *` plus `workflow_dispatch`. It calls the Notion query API with `NOTION_TOKEN`, transforms each page into a flat `Book` record, sorts Finished by `Finished` date desc, and writes the snapshot. Idempotent — only commits + deploys when the snapshot diff is non-empty.
- **Page render:** `src/pages/reading/index.astro` reads the JSON, splits into Currently / Finished / Want to Read sections, and groups Finished by year. Ratings render as `N/5`; do not invent reviews or ratings.
- **Setup (one-time):** create an internal integration at notion.so/my-integrations, share the Reading List page with the integration, set `NOTION_TOKEN` as a GitHub secret on this repo. The script reads `NOTION_READING_DB` env var to override the database id if it ever changes; default is the known id.

## Writing posts from Notion (no-code authoring)

Posts on `/field` and `/stupidshit` can be authored entirely in Notion — no commits, no IDE. The pipeline mirrors Published rows of a Notion database into markdown files in the matching content collection on every sync.

- **Notion database schema (required columns):**
  - `Title` — title
  - `Summary` — rich_text (used for the index card blurb + meta description)
  - `Date` — date (drives sort + the filename prefix `<date>-<slug>.md`)
  - `Status` — select: `Draft` | `Published` (only `Published` rows are written; flipping to Draft removes the file on next sync)
  - `Collection` — select: `stupidshit` | `field` (defaults to `stupidshit` if unset)
  - `Slug` — rich_text, optional (auto-derived from Title if blank)
  - `Tags` — multi_select, optional (only applied for `stupidshit` posts)
- **Body:** any Notion block content — paragraphs, headings (H1–H3), bulleted/numbered/toggle lists, to-dos, quotes, callouts (rendered as blockquotes with leading emoji), code blocks (language preserved), dividers, images, embeds, bookmarks. Rich-text annotations (bold, italic, strikethrough, inline code, links) are preserved.
- **Images:** Notion-hosted images expire on a ~1h signed URL, so the sync downloads each image to `public/posts/<slug>/<sha1>.<ext>` and rewrites the markdown to point at the stable local path. Captions become the alt text.
- **Posts database:** `https://www.notion.so/8274ed5c50304f20a598bf7bb30d7d3f` (Posts, db id `8274ed5c50304f20a598bf7bb30d7d3f`), sibling of Reading List under "🎯 Personal" — so the same internal integration that backs the reading-list sync already has access. The id is hardcoded as the default in `scripts/sync-posts.mjs`; `NOTION_POSTS_DB` env override only needed if it ever moves.
- **Sync workflow:** `.github/workflows/sync-posts.yml` runs cron `*/30 * * * *` plus `workflow_dispatch` plus `repository_dispatch[post-update]` (left wired for a future webhook). It calls `scripts/sync-posts.mjs` with `NOTION_TOKEN`, then commits + builds + deploys only when the diff is non-empty.
- **Reconciliation:** each generated file carries `notion_id: "<page uuid>"` in its frontmatter. On each sync the script scans both content dirs for that field, builds a `notion_id → file` map, and:
  - rewrites the file in place when content changes
  - moves it (delete old, write new) when slug/date/collection changes
  - deletes the file when the page is unpublished or removed in Notion
  Hand-authored markdown files without a `notion_id` are left alone — the two authoring modes coexist safely.
- **Concurrency:** shares the `bot-pushes-main` concurrency group with the other sync workflows; commit author is `posts-bot <bot@nasser1931.com>`.
- **Setup:** done once on 2026-05-15 — db created, integration access inherited from "🎯 Personal" parent, default db id baked into the script, `NOTION_TOKEN` already a GH secret. Day-to-day: open the Posts db in Notion, write a row, set Status=Published, then either wait ≤30min for cron or run `gh workflow run sync-posts.yml` to ship now.

## Races

The homepage Race log card and `/field#races` read two files. `src/data/races.json` is a curated record of past races with results taken from recorded intervals.icu activities (date, name, kind, distance, status finished/dnf/dns, total, splits). Edit it by hand after a race; never invent times or placings. `src/data/next-race.json` is written by the pulse bot. The countdown is recomputed in the browser so it doesn't go stale between deploys. `/coach` and its engine, snapshots, and workflow were removed on 23 September 2026 (Project Furnace replaced them); `firebase.json` 301-redirects `/coach` to `/field`.

## firebase.json

`dist` is the public dir. Caching headers:
- `*.html` → `max-age=0, must-revalidate` (always fresh)
- `*.{js,css,webp,avif,woff2}` → `max-age=31536000, immutable` (Astro's hashed assets)

`cleanUrls: true` means `/paper` works (no `.html` suffix needed).

## Outstanding cleanups

- `www.nasser1931.com` is not configured. Add a redirect in Firebase or a Route 53 record (covered above in DNS records).
