# nasser1931.com

[![Deploy to Firebase Hosting on merge](https://github.com/NasserAlbusaidi/nasser1931.com/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/NasserAlbusaidi/nasser1931.com/actions/workflows/firebase-hosting-merge.yml)

**[nasser1931.com →](https://nasser1931.com)**

Personal home of [Nasser Al Busaidi](https://nasser1931.com): software, racing, experiments, and reading. Astro static build, deployed to Firebase Hosting. **Personal observatory** — see [`DESIGN.md`](./DESIGN.md). Project notes in [`CLAUDE.md`](./CLAUDE.md).

The homepage pairs Earth artwork with selected projects, a race log, the series on the shelf, and a bookshelf. Rihla links to the App Store and Google Play; Einstein’s Travel Bureau is featured. The welcome post stays in Notes without occupying the homepage.

Section-specific social cards and responsive Astro images are included.

## Stack

- Astro 6 + React 19 + Tailwind 4
- Fonts: self-hosted Outfit display/UI and Literata prose; system mono for log labels and data
- Firebase Hosting (project: `nasser-portfolio`, see CLAUDE.md gotcha)
- DNS: Route 53; cert auto-issued by Google Trust Services

## Commands

```sh
npm run dev              # local dev — http://localhost:4321
npm test                 # node --test: redirects, reading series, StoryGraph importer
npm run sync-hardcover   # refresh reading from Hardcover (needs HARDCOVER_TOKEN; CI runs it every 6h)
npm run build            # static output to dist/
firebase deploy --only hosting --project nasser-portfolio  # manual ship
```

`main` auto-deploys via GitHub Actions. PRs get preview channels.

## Site map

```
/             personal introduction, selected projects, races, reading
/builds       Projects — apps, tools, and open source
/races        race log with splits, paces, and transitions
/stupidshit   Notes — one-off ideas and oddities
/reading      books, by year
```

## Files of interest

- `src/styles/global.css` — design tokens (CSS vars + Tailwind 4 `@theme`)
- `src/styles/home.css` — observatory homepage and responsive composition
- `src/pages/index.astro` — introduction, featured work, races, series, and reading
- `src/components/PageIntro.astro` — shared section-index introduction
- `src/layouts/Entry.astro` — layout for `/stupidshit` entries
- `src/components/ThemeToggle.astro` — light/dark toggle (FOUC-safe boot in `BaseHead.astro`)
- `firebase.json` — 301s for retired routes (`/field`, `/coach` → `/races`; `/paper` → `/builds`), checked by `scripts/redirects.test.mjs`

## Reading

The shelf syncs from [Hardcover](https://hardcover.app/@nasser) every 6 hours (`sync-hardcover.yml`), with covers cached by `cache-covers.mjs`. `src/data/reading-series.json` lists the series catalogues that drive "Worlds I'm in" and the reading order per series.

### StoryGraph fallback

A StoryGraph export can still replace the shelf by hand. Running it hands ownership of the snapshot to StoryGraph; the Hardcover sync then waits until it runs once with `-f takeover=true`. To import, open [Export your library](https://app.thestorygraph.com/user-export), generate and download a new CSV, then run `npm run import-storygraph -- "C:/path/to/export.csv" nasser1931`. The importer validates the file before writing, preserves partial read dates and decimal ratings, and excludes reviews, custom tags, owned-only records, and DNF books. Keep the raw export outside the repository. No password, cookie, or signed download URL belongs in source control.

After an import, `src/data/reading.json` records `source: "storygraph"`, the public profile URL, and import time. The old Notion refresh exits without changes while another source owns the snapshot, so its scheduled workflow does not overwrite this import. An older workflow run also fails a stale push instead of rebasing old Notion data over a source switch. Publishing an updated snapshot still follows the site's existing separately authorized deployment workflow.

Validation: `npm test`.
