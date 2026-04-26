# Next session — pick up here

Session of 2026-04-26 set up the workflow tooling and locked the Field Journal design system. Site is **not yet rebuilt** — `src/` is still the Astro blog template under the hood. DESIGN.md is the spec; the next session is the rebuild.

## Where we left off

- ✅ Repo at https://github.com/NasserAlbusaidi/nasser1931.com (public, main branch)
- ✅ `npm run sync-paper` mirrors `study-v1.md` + figures from ProjecrFurnance into `public/paper/`
- ✅ `npm run dev:paper` runs astro dev + chokidar watcher for v1/figure changes
- ✅ Paper prose is canonical in `src/pages/paper/index.md` (option A — v2 in ProjecrFurnance is dead-letter)
- ✅ CI workflows committed: `.github/workflows/firebase-hosting-{merge,pull-request}.yml`
- ✅ DESIGN.md v0.1 locked: Field Journal — cream + rust + Fraunces / Source Serif 4 / Geist / Geist Mono
- ❌ Firebase SA secret not yet created → CI runs are failing
- ❌ Site visual layer still stock Astro template; nothing renders against DESIGN.md yet

## P0 — unblocks CI (5 min, do first)

- [ ] Run `firebase init hosting:github` in repo root.
  - Auths GitHub via browser, picks `NasserAlbusaidi/nasser1931.com`, creates a service account on the `nasser-portfolio` Firebase project, sets `FIREBASE_SERVICE_ACCOUNT_NASSER_PORTFOLIO` as a repo secret.
  - When it asks to generate workflow files: **decline.** We have cleaner ones already.
  - When it asks for a build script / live channel: enter `npm ci && npm run build` and `live` if prompted.
- [ ] Push an empty commit (`git commit --allow-empty -m "ci: re-trigger after SA secret"`) and verify the merge workflow goes green at https://github.com/NasserAlbusaidi/nasser1931.com/actions.

## P1 — Field Journal rebuild

Single PR off `main` is fine (no preview channel until P0 is done; can verify locally first). Order matters — earlier items unblock later ones.

### Foundation
- [ ] `npm install @astrojs/react react react-dom @types/react @types/react-dom` and add the React integration in `astro.config.mjs`.
- [ ] Add Tailwind 4 (`@astrojs/tailwind` or `@tailwindcss/vite`) and encode the DESIGN.md tokens in the Tailwind theme:
  - colors: `bg / surface / ink / muted / rule / accent / accent-soft` for light + dark variants
  - fonts: `display / body / ui / mono`
  - spacing: 4px-base scale (2xs…5xl)
  - radii: `sm 2 / md 4 / lg 6 / full 9999`
  - container widths: `prose 680 / wide 1040 / figure 1100`
- [ ] Wire all four Google Fonts in `src/components/BaseHead.astro` via the single `<link>` block from DESIGN.md.
- [ ] Implement the light/dark toggle: CSS vars driven by `html.dark` class, JS persistence to `localStorage` key `np-theme`, default to `prefers-color-scheme` on first visit. (Pattern is in the preview file — see /tmp note below.)

### Layout / chrome
- [ ] Rewrite `Header.astro`: brand mark `nasser1931.com` (Fraunces 600, with rust dot in `.com`), six category links (paper / blog / field / stupidshit / reading / about), theme toggle button, sticky with backdrop-blur.
- [ ] Rewrite `Footer.astro` (currently template copy).
- [ ] Rewrite `src/pages/index.astro`: hero ("Nasser **Al Busaidi**" with family name in rust), tagline italic, mono meta line (location / current focus / last-updated), then date-right `<ul>` per category section like the preview's home mock.
- [ ] Rewrite `src/pages/about.astro` (currently boilerplate).

### The paper
- [ ] Replace `src/layouts/Paper.astro` with a layout that matches DESIGN.md Field Journal:
  - FIELD REPORT eyebrow (mono uppercase 0.18em tracking, muted)
  - Fraunces H1 with `opsz 96` w600
  - Italic Source Serif subtitle, mono byline
  - Body: Source Serif 4 17px / 1.65, old-style figures
  - Numbers in prose (`r = +0.51`, `n = 35`, dates) wrapped in mono
  - Inline `<code>` styled as rust-on-soft-rust pill
  - `<figure>` keeps the existing full-bleed breakout, but figcaption uses bold-prefix pattern with `<strong>Figure N.</strong>` in `--ink`, rest in `--muted`
- [ ] Verify the existing `index.md` paper still renders cleanly under the new layout. The eight figure blocks already use the bold-prefix pattern, so no markdown edits should be needed.

### New collections
- [ ] Add `src/content/field/` content collection with frontmatter schema: `{ date, title, summary, stats?: { swim?, bike?, run?, total?, power?, hr?, distance? } }`. Render list (date-mono left, summary right) per `/field` mockup in the preview.
- [ ] Add `src/content/stupidshit/` collection with looser schema: `{ date, title, summary, tags? }`. Each entry is a small post with the rust eyebrow `stupidshit` label.
- [ ] Wire dynamic routes: `src/pages/field/[...slug].astro`, `src/pages/stupidshit/[...slug].astro`, plus `index.astro` for each.

### Cleanups
- [ ] Delete Astro template demo posts: `src/content/blog/{first,second,third,markdown-style-guide,using-mdx}.{md,mdx}`. Replace `src/pages/blog/index.astro` with the Field Journal date-right pattern. Or seed one real blog post if anything's ready.
- [ ] Update `README.md` (currently `# Astro Starter Kit: Blog`).

## P2 — interactive figures (later)

- [ ] Extend `scripts/sync-paper.mjs` to mirror raw data from `~/Desktop/Personal/ProjecrFurnance/paper/data/` (CSV / JSON / Parquet) into `public/paper/data/`.
- [ ] Pick the first interactive figure: **Figure 1** (longitudinal multipanel, Sep 2022 → Apr 2026) — most rewarding to brush across because of the four panels and the Act I → Act II hinge.
- [ ] Build a React component using **Observable Plot** (declarative, small bundle, pretty defaults) wrapping the data. Hover for values, brush across time, optional phase-shading toggle.
- [ ] Graceful fallback: if data file is missing or JS is off, render the existing PNG with the same caption.
- [ ] Iterate to other figures only if it's actually rewarding — most don't need to be interactive.

## P3 — domain + housekeeping

- [ ] Add `www → apex` redirect (re-add custom domain in Firebase with the redirect option, OR add a manual record in Route 53). Currently `www.nasser1931.com` fails to resolve.
- [ ] Decide whether to bring `study-v2.md` in ProjecrFurnance into line with the canonical `index.md`, or delete it. It's currently an older draft with different prose and a missing figure.
- [ ] Self-host the four Google Fonts if/when LCP starts mattering.

## Useful pointers

- **DESIGN.md** — the spec. Reference it before any visual decision.
- **CLAUDE.md** — current project doc, design-system section near top.
- **Reference screenshots from research:** `/tmp/design-research-nasser/{macwright,thesephist,maggieappleton,patrickcollison,robinsloan}.png` (probably gone after restart — ok, they were just inspiration).
- **Design preview HTML:** `/tmp/design-consultation-preview-1777220851.html` (gets nuked on `/tmp` cleanup; the design IS DESIGN.md, the preview was just the taste-check artifact). Regenerate from DESIGN.md if you want it again.
- **Firebase project ID:** `nasser-portfolio` (NOT `nasser1931` — see CLAUDE.md "Critical gotcha").
- **Paper sync source:** `~/Desktop/Personal/ProjecrFurnance/paper/` (override with `PAPER_SOURCE` env var).

## One-line summary for next session

> Run `firebase init hosting:github` first to unblock CI. Then start P1 in order — react integration, Tailwind tokens, fonts, theme toggle, header, hero, paper layout, then collections.
