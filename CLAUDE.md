# nasser1931.com

Personal site. Astro static build, deployed to Firebase Hosting. Centerpiece is the field-report paper at `/paper`; everything else is scaffolding.

## Design System

Always read **DESIGN.md** before making any visual or UI decision. All font choices, colors, spacing, type scale, layout widths, motion durations, category names, and component patterns are defined there. Do not deviate without explicit user approval. The system is named "Field Journal" — editorial-personal, cream-on-ink with rust accent, Fraunces / Source Serif 4 / Geist / Geist Mono. Anti-patterns (purple gradients, icon-in-circle grids, etc.) are listed explicitly.

When QA-ing a UI change, flag any code that doesn't match DESIGN.md.

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
gh workflow run refresh-pulse.yml                    # easier: run the same refresh on CI; commits + pushes only on diff
gh workflow run sync-paper.yml                       # manually trigger the project-furnace → /paper sync (also runs every 30min)
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
│   ├── index.astro            ← home page, features the paper
│   ├── paper/
│   │   └── index.md           ← /paper (synced from endurance-license/study.md)
│   ├── field/                 ← /field index + dynamic [...slug] route
│   ├── stupidshit/            ← /stupidshit index + dynamic [...slug] route
│   └── reading/               ← /reading stub
├── content/
│   ├── field/                 ← /field entries
│   └── stupidshit/            ← /stupidshit entries
├── layouts/
│   ├── Entry.astro            ← shared layout for /field + /stupidshit entries
│   └── Paper.astro            ← long-form layout for /paper
├── components/
│   ├── Header.astro           ← nav: paper / field / stupidshit / reading + theme toggle
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
- **Editing log:** Visible at the foot of `/paper`. The 8 most recent commits to `paper/**` in project-furnace, sourced from `src/data/paper-log.json` (written by `scripts/refresh-paper-log.mjs`). The byline gets a "last edited Xh ago · N commits this week" stamp; the homepage paper card gets a "· edited Xh ago" suffix. All relative timestamps recompute in the browser from `data-iso` so static HTML doesn't show a stale build-time value.
- **Local fallback (offline editing):** `npm run sync-paper` still works against `~/Desktop/Personal/ProjecrFurnance` (which is a local clone of project-furnace). Use this for previewing changes before pushing — but the canonical publish path is push-to-project-furnace, not local sync + commit-here.
- **Concurrency:** sync-paper and refresh-pulse share `concurrency.group: bot-pushes-main` so they never race to push to main. Each also `git pull --rebase origin main` before push as belt-and-suspenders.

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
- Figures break out wider via `figure { margin-left: 50%; transform: translateX(-50%); width: min(1100px, calc(100vw - 2em)); }`.
- Captions render via `<figcaption>` styled italic gray; the `Figure N.` prefix is bolded.
- All section H2s have `margin-top: 2.4em` for clear section breaks.

`src/pages/index.astro`:
- Home page features the paper as a clickable card. The whole card is a single `<a class="feature-link">` wrapping a `<div class="feature">`. **Do not nest another `<a>` inside** — browsers close the outer anchor early and the click breaks. The h2 inside is plain text; hover color comes from `.feature:hover h2`.

## DNS records (Route 53, hosted zone `nasser1931.com.`)

| Type | Name (apex) | Value | Purpose |
|------|-------------|-------|---------|
| A    | (empty)     | `199.36.158.100` | Firebase Hosting edge |
| TXT  | (empty)     | `"hosting-site=nasser-portfolio"` | Firebase ownership verification |

Both records must be at the apex. In Route 53, **leave the Name field empty** to mean apex — typing `nasser1931.com` causes Route 53 to append the zone, producing `nasser1931.com.nasser1931.com`.

`www.nasser1931.com` is **not configured**. Visitors typing `www` will fail. To add: re-add the custom domain in Firebase with the "redirect www → apex" option, or add a manual record in Route 53.

## The training pulse

The home page renders a "currently training" section above the paper card, sourced from `src/data/training.json`. The JSON is a committed snapshot — visitors get whatever was last pushed.

- **Source:** intervals.icu API (which is fed by Garmin → intervals.icu sync).
- **Refresh:** `.github/workflows/refresh-pulse.yml` runs on cron `0 */6 * * *` plus `workflow_dispatch`. The script (`scripts/refresh-pulse.mjs`) fetches the last 14 days of activities + wellness, writes `src/data/training.json`, and the workflow commits + pushes **only if the snapshot diff is non-empty** — so quiet days don't trigger a redeploy.
- **Form translation:** TSB = CTL − ATL. `> +5` → `fresh`, `−10..+5` → `neutral`, `< −10` → `fatigued`. Standard TrainingPeaks bands.
- **Component:** `src/components/HomePulse.astro` reads the JSON at build, renders a 3-row date-right list of recent sessions plus a summary line (weekly hours · TSS · form · "updated X ago"). The `updated X ago` text is recomputed in the browser from `data-iso` so it stays accurate between refreshes.
- **Secrets (GitHub Actions):** `INTERVALS_API_KEY`, `INTERVALS_ATHLETE_ID`. Local credential mirror lives in `~/Desktop/Personal/Portfolio/.env` under the `VITE_INTERVALS_*` names — the script reads either prefix.
- **Manual refresh:** `gh workflow run refresh-pulse.yml` is the simplest path. Locally you can also `bash -c 'set -a; source ~/Desktop/Personal/Portfolio/.env; set +a; npm run refresh-pulse'`.
- **The pulse-bot commit author** (`pulse-bot <bot@nasser1931.com>`) is harmless — these commits are auto-generated and only ever touch `src/data/training.json`.

## firebase.json

`dist` is the public dir. Caching headers:
- `*.html` → `max-age=0, must-revalidate` (always fresh)
- `*.{js,css,webp,woff2}` → `max-age=31536000, immutable` (Astro's hashed assets)

`cleanUrls: true` means `/paper` works (no `.html` suffix needed).

## Outstanding cleanups

- `Footer.astro` likely has Astro template copy.
- Template OG fallback still imports `src/assets/blog-placeholder-1.jpg` (other `blog-placeholder-*.jpg` and `blog-placeholder-about.jpg` are unused — safe to delete and rename the fallback).
