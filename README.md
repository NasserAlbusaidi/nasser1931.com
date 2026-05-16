# nasser1931.com

Personal site of [Nasser Al Busaidi](https://nasser1931.com). Astro static build, deployed to Firebase Hosting. **Press** design system (v0.2) — see [`DESIGN.md`](./DESIGN.md). Project notes in [`CLAUDE.md`](./CLAUDE.md).

The flagship is the field-report paper at [`/paper`](https://nasser1931.com/paper). The rest of the site is scaffolding.

## Stack

- Astro 6 + React 19 + Tailwind 4
- Fonts: Fraunces, Source Serif 4, JetBrains Mono (Google Fonts) + Switzer (Fontshare)
- Firebase Hosting (project: `nasser-portfolio`, see CLAUDE.md gotcha)
- DNS: Route 53; cert auto-issued by Google Trust Services

## Commands

```sh
npm run dev              # local dev — http://localhost:4321
npm run dev:paper        # dev + chokidar watcher syncing v1/figures from ProjecrFurnance
npm run sync-paper       # one-shot sync of paper receipts + figures
npm run build            # static output to dist/
firebase deploy --only hosting --project nasser-portfolio  # manual ship
```

`main` auto-deploys via GitHub Actions. PRs get preview channels.

## Site map

```
/             home (magazine cover)
/paper        field report — long-form
/field        training milestones, race results
/stupidshit   one-off oddities
/reading      books, by year
```

## Files of interest

- `src/styles/global.css` — design tokens (CSS vars + Tailwind 4 `@theme`)
- `src/layouts/Paper.astro` — long-form layout for the paper
- `src/layouts/Entry.astro` — layout shared by `/field` and `/stupidshit` entries
- `src/components/ThemeToggle.astro` — light/dark toggle (FOUC-safe boot in `BaseHead.astro`)
- `scripts/sync-paper.mjs` — mirrors `study-v1.md` + figures from `~/Desktop/Personal/ProjecrFurnance/paper/`
