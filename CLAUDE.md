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
npm run dev:paper                                    # dev + chokidar watcher syncing v1/figures from ProjecrFurnance
npm run sync-paper                                   # one-shot mirror of v1 + figures from ProjecrFurnance
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
│   ├── about.astro            ← (still template boilerplate)
│   ├── paper/index.md         ← THE paper (renders /paper)
│   ├── blog/                  ← Astro template index + dynamic post route
│   └── rss.xml.js
├── content/blog/              ← markdown blog posts (template demos still here)
├── layouts/
│   ├── BlogPost.astro         ← stock template layout for blog posts
│   └── Paper.astro            ← custom long-form layout for /paper
├── components/
│   ├── Header.astro           ← nav: Home / Paper / Blog / About
│   ├── Footer.astro
│   ├── BaseHead.astro
│   ├── HeaderLink.astro
│   └── FormattedDate.astro
public/
└── paper/
    ├── study-v1.md            ← canonical v1 (raw download, served as-is)
    └── figures/               ← 7 PNG figures referenced from paper/index.md
```

## The paper

Sources of truth split across two places:

- **Published prose** — `src/pages/paper/index.md` is canonical. Edit it here. `npm run dev` gives instant HMR preview at http://localhost:4321/paper. This is the version that diverged from v2 as the prose was iterated; v2 in ProjecrFurnance is now an older draft.
- **Receipts (`study-v1.md`) + figures** — still live in `~/Desktop/Personal/ProjecrFurnance/paper/` next to the analysis scripts. Mirrored into `public/paper/` by `npm run sync-paper`.

Workflow:

```bash
npm run dev:paper        # astro dev + watcher; figure changes in ProjecrFurnance auto-sync and HMR-reload
npm run sync-paper       # one-shot sync if you don't want the watcher
PAPER_SOURCE=/some/other/path npm run sync-paper  # override the source dir
```

The synced files (`public/paper/study-v1.md`, `public/paper/figures/*.png`) are committed to the repo — CI does NOT run sync-paper. Run sync locally before committing if v1 or a figure changed in ProjecrFurnance.
#    Easiest: hand-merge new content into the existing index.md, preserving the HTML <figure> blocks.
```

The figure-numbering quirk from `ProjecrFurnance/paper/CLAUDE.md` carries over: filenames are in v1 build-artifact order, displayed in v2 reading order. e.g., **Figure 3** in the rendered paper is `fig06_strength_regression.png`. Don't rename the files.

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

## firebase.json

`dist` is the public dir. Caching headers:
- `*.html` → `max-age=0, must-revalidate` (always fresh)
- `*.{js,css,webp,woff2}` → `max-age=31536000, immutable` (Astro's hashed assets)

`cleanUrls: true` means `/paper` works (no `.html` suffix needed).

## Outstanding cleanups

- `/blog` still serves Astro template demo posts (`src/content/blog/{first,second,third,markdown-style-guide,using-mdx}.{md,mdx}`).
- `/about` is template boilerplate.
- `Footer.astro` likely has Astro template copy.
- No `www` redirect.
