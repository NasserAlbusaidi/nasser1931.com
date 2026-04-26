# nasser1931.com

Personal site. Astro static build, deployed to Firebase Hosting. Centerpiece is the field-report paper at `/paper`; everything else is scaffolding.

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
npm run build                                        # static output to dist/
firebase deploy --only hosting --project nasser-portfolio  # ship
```

A redeploy is the easiest way to invalidate Fastly's edge cache if the site appears stale on the custom domain.

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

**Source of truth lives elsewhere** — at `~/Desktop/Personal/ProjecrFurnance/paper/`:
- `study-v2.md` is the readable layer published on the site.
- `study-v1.md` is the canonical version with appendices, served raw at `/paper/study-v1.md`.
- `figures/fig0[1-7]_*.png` are the 7 plot outputs.

To update the paper after edits in ProjecrFurnance:

```bash
# 1. Sync v1 (raw download)
cp ~/Desktop/Personal/ProjecrFurnance/paper/study-v1.md public/paper/study-v1.md

# 2. Sync figures
cp ~/Desktop/Personal/ProjecrFurnance/paper/figures/*.png public/paper/figures/

# 3. Sync v2 → src/pages/paper/index.md
#    NOT a straight copy. The published version has:
#    - Frontmatter (layout/title/subtitle/byline/description) replacing v2 lines 1-9
#    - Figure refs rewritten: ![..](figures/X.png) → <figure><img src="/paper/figures/X.png" alt="Figure N." /><figcaption>...</figcaption></figure>
#    - The §10 v1 references linked: [`study-v1.md`](/paper/study-v1.md)
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
