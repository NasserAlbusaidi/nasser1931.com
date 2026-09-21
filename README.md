# nasser1931.com

[![Deploy to Firebase Hosting on merge](https://github.com/NasserAlbusaidi/nasser1931.com/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/NasserAlbusaidi/nasser1931.com/actions/workflows/firebase-hosting-merge.yml)

**[nasser1931.com →](https://nasser1931.com)**

Personal home of [Nasser Al Busaidi](https://nasser1931.com): software, cycling, experiments, and reading. Astro static build, deployed to Firebase Hosting. **Personal observatory** — see [`DESIGN.md`](./DESIGN.md). Project notes in [`CLAUDE.md`](./CLAUDE.md).

The homepage pairs Earth artwork with selected projects, a dated cycling recommendation, the training log, and five books. Rihla links to the App Store and Google Play; The Silent Creep and Einstein’s Travel Bureau are featured. Welcome posts stay in Notes and Life without occupying the homepage.

The public coach is a read-only recommendation and four-day outlook. No operator controls, raw wellness payloads, or diagnostic reasoning are shipped to the browser. Source snapshots still exist in this public repository and its history. Section-specific social cards and responsive Astro images are included.

## Stack

- Astro 6 + React 19 + Tailwind 4
- Fonts: self-hosted Outfit display/UI and Literata prose; system mono for log labels and data
- Firebase Hosting (project: `nasser-portfolio`, see CLAUDE.md gotcha)
- DNS: Route 53; cert auto-issued by Google Trust Services

## Commands

```sh
npm run dev              # local dev — http://localhost:4321
npm run dev:paper        # dev + chokidar watcher syncing v1/figures from ProjecrFurnance (sic)
npm run sync-paper       # one-shot sync of paper receipts + figures
npm run import-storygraph -- <export.csv> nasser1931  # refresh reading from an official StoryGraph export
npm run build            # static output to dist/
firebase deploy --only hosting --project nasser-portfolio  # manual ship
```

`main` auto-deploys via GitHub Actions. PRs get preview channels.

## Site map

```
/             personal introduction, selected projects, life, reading
/builds       Projects — apps, research, and open source
/paper        field report — long-form
/field        Life — training snapshot and field notes
/stupidshit   Notes — one-off ideas and oddities
/reading      books, by year
/coach        cycling briefing and workout details
```

## Files of interest

- `src/styles/global.css` — design tokens (CSS vars + Tailwind 4 `@theme`)
- `src/styles/home.css` — observatory homepage and responsive composition
- `src/pages/index.astro` — introduction, featured work, cycling, notes, and reading
- `src/components/PageIntro.astro` — shared section-index introduction
- `src/layouts/Paper.astro` — long-form layout for the paper
- `src/layouts/Entry.astro` — layout shared by `/field` and `/stupidshit` entries
- `src/components/ThemeToggle.astro` — light/dark toggle (FOUC-safe boot in `BaseHead.astro`)
- `scripts/sync-paper.mjs` — mirrors `study-v1.md` + figures from `~/Desktop/Personal/ProjecrFurnance/paper/` (sic — the directory really is spelled that way)

## Reading from StoryGraph

The reading snapshot now comes from `nasser1931` on StoryGraph. It is an **export import**, not an automatic account connection: StoryGraph's public API remains on its long-term roadmap, and this account's profile is Community-only.

To refresh, open [Export your library](https://app.thestorygraph.com/user-export), generate and download a new CSV, then run `npm run import-storygraph -- "C:/path/to/export.csv" nasser1931`. The importer validates the file before writing, preserves partial read dates and decimal ratings, and excludes reviews, custom tags, owned-only records, and DNF books. Keep the raw export outside the repository. No password, cookie, or signed download URL belongs in source control.

`src/data/reading.json` records `source: "storygraph"`, the public profile URL, and import time. The old Notion refresh exits without changes while another source owns the snapshot, so its scheduled workflow does not overwrite this import. An older workflow run also fails a stale push instead of rebasing old Notion data over a source switch. Publishing an updated snapshot still follows the site's existing separately authorized deployment workflow.

Validation: `node --test scripts/import-storygraph.test.mjs`.
