# Next session — pick up here

P1 Field Journal rebuild **shipped 2026-04-26**. Build clean, 9 pages, all routes 200 locally. CI is still red until P0 is done.

## Where we left off (2026-04-26 ~8:48pm)

**P1 — Field Journal rebuild (DONE)**
- ✅ React + Tailwind 4 installed, integrations wired (`astro.config.mjs`)
- ✅ Design tokens in `src/styles/global.css` — Tailwind 4 `@theme` block + CSS vars for light + dark, type scale, spacing, radii, container widths
- ✅ Google Fonts (Fraunces / Source Serif 4 / Geist / Geist Mono) wired in `BaseHead.astro` with FOUC-safe theme boot script
- ✅ `ThemeToggle.astro` — light/dark, persists to `np-theme`, defaults to `prefers-color-scheme`
- ✅ `Header.astro` — brand with rust `.` dot, six category links (paper/blog/field/stupidshit/reading/about), sticky w/ backdrop-blur, active state with rust dot prefix
- ✅ `Footer.astro` — minimal mono meta
- ✅ Home page — hero ("Nasser **Al Busaidi**" rust family name), mono meta line, four section blocks (paper/field/stupidshit/blog) with date-right `<ul>`
- ✅ `about.astro` — real content (no more lorem ipsum)
- ✅ `Paper.astro` layout rewritten — Field Report eyebrow, Fraunces H1 opsz 96, italic subtitle, mono byline, full-bleed figures with bold-prefix figcaption, rust pill code, mono numbers
- ✅ `BlogPost.astro` rewritten in Field Journal style
- ✅ `field/` content collection + `/field` index + `/field/[...slug]` dynamic route — one seed entry
- ✅ `stupidshit/` content collection + `/stupidshit` index + `/stupidshit/[...slug]` dynamic route — one seed entry
- ✅ `/reading` stub page
- ✅ Deleted Astro template demo blog posts (first/second/third/markdown-style-guide/using-mdx)
- ✅ `Entry.astro` shared layout for /field + /stupidshit entries
- ✅ README.md replaced (was "Astro Starter Kit: Blog")

## P0 — still required (5 min, blocks CI)

- [ ] Run `firebase init hosting:github` in repo root.
  - Auths GitHub via browser, picks `NasserAlbusaidi/nasser1931.com`, creates a service account on the `nasser-portfolio` Firebase project, sets `FIREBASE_SERVICE_ACCOUNT_NASSER_PORTFOLIO` as a repo secret.
  - When it asks to generate workflow files: **decline.** We have cleaner ones already.
  - When it asks for build script / live channel: enter `npm ci && npm run build` and `live`.
- [ ] Push an empty commit (`git commit --allow-empty -m "ci: re-trigger after SA secret"`) and verify the merge workflow goes green at https://github.com/NasserAlbusaidi/nasser1931.com/actions.

## P1 — visual QA + polish (next session)

- [ ] Open the site in a real browser and walk every page (`npm run dev`). Things worth eyeballing:
  - Hero typography on `/` — does Fraunces 144 render at the right weight?
  - Theme toggle — light → dark → light. Does the boot script prevent flash on reload?
  - Paper figures — does the breakout still center at narrow viewports?
  - Active-link rust dot in header
  - Mobile breakpoint — is the 6-link nav row OK at 375px?
- [ ] Build is clean but **rss.xml emits warnings** because the blog collection is empty. Either suppress the warning in `src/pages/rss.xml.js` (early return when `posts.length === 0`) or wait until a real blog post exists.
- [ ] Decide: keep the seed `field` and `stupidshit` entries, replace, or delete and accept the empty-state placeholder.
- [ ] FormattedDate component still uses the template's date format — verify it matches the mono date treatment in DESIGN.md (likely fine, but double-check).

## P2 — interactive figures (later)

- [ ] Extend `scripts/sync-paper.mjs` to mirror raw data from `~/Desktop/Personal/ProjecrFurnance/paper/data/` (CSV / JSON / Parquet) into `public/paper/data/`.
- [ ] Pick first interactive figure: **Figure 1** (longitudinal multipanel, Sep 2022 → Apr 2026) — most rewarding to brush across.
- [ ] Build a React component using **Observable Plot** (declarative, small bundle). Hover values, brush time, optional phase-shading toggle.
- [ ] Graceful fallback: if data file missing or JS off, render the existing PNG with the same caption.
- [ ] Iterate to other figures only if it's actually rewarding — most don't need to be interactive.

## P3 — domain + housekeeping

- [ ] Add `www → apex` redirect (re-add custom domain in Firebase with the redirect option, OR add a manual record in Route 53). Currently `www.nasser1931.com` fails to resolve.
- [ ] Decide whether to bring `study-v2.md` in ProjecrFurnance into line with the canonical `index.md`, or delete it.
- [ ] Self-host the four Google Fonts if/when LCP starts mattering.
- [ ] Remove unused `src/assets/fonts/atkinson-*.woff` files (no longer referenced after `astro.config.mjs` cleanup).

## Useful pointers

- **DESIGN.md** — the spec. Reference it before any visual decision.
- **CLAUDE.md** — current project doc. Updated last session with workflow + Firebase gotcha.
- **Firebase project ID:** `nasser-portfolio` (NOT `nasser1931`).
- **Paper sync source:** `~/Desktop/Personal/ProjecrFurnance/paper/` (override with `PAPER_SOURCE` env var).
