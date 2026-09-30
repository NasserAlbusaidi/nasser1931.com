# nasser1931.com

[![Deploy to Firebase Hosting on merge](https://github.com/NasserAlbusaidi/nasser1931.com/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/NasserAlbusaidi/nasser1931.com/actions/workflows/firebase-hosting-merge.yml)

**[nasser1931.com →](https://nasser1931.com)**

Personal home of [Nasser Al Busaidi](https://nasser1931.com): software, racing, notes, reading, and the night sky. The site is laid out as a solar system. The homepage hero is a clickable three.js orrery where each section is a body: Earth is Projects, Mars is Races, the asteroid is Notes, Saturn is Reading, and the Sun is home. Each body's size and speed come from the real data behind it, so a section that changed recently moves faster.

Below the hero, an "In orbit now" feed lists the newest item from each section, then one section per planet in orbit order. The latest night-sky photo closes the page. Without WebGL, with reduced motion, or with save-data on, the orrery stays a static Earth and three.js is never downloaded.

Design notes are in [`DESIGN.md`](./DESIGN.md), project notes in [`CLAUDE.md`](./CLAUDE.md).

## Stack

- Astro 6 static build, Tailwind 4, three.js for the orrery
- Fonts, all self-hosted: Outfit (display and UI), Literata (prose), IBM Plex Mono (labels and data)
- Firebase Hosting (project `nasser-portfolio`; see the gotcha in CLAUDE.md)
- DNS on Route 53; certificate auto-issued by Google Trust Services

## Site map

```
/             the orrery, "In orbit now", and one section per planet
/builds       Projects: apps, tools, and open source
/races        Mars and its race moons, the build-up ladder, and every race with splits and paces
/stupidshit   Notes: short pieces, written in Notion
/reading      the shelf, series tracks, and finished books by year
/sky          night-sky photos, with capture data and a timelapse
```

## Where the content comes from

Everything on the site is committed data; nothing is invented to fill a gap.

| Section | Source | How it updates |
|---------|--------|----------------|
| Notes | a Notion database | `sync-posts.yml` every 30 minutes; images are copied into the site |
| Reading | [Hardcover](https://hardcover.app/@nasser) | `sync-hardcover.yml` every 6 hours; covers cached by `cache-covers.mjs` |
| Next race | the intervals.icu calendar | `refresh-next-race.yml` every 6 hours |
| Race results | recorded race files | `src/data/races.json`, edited by hand after a race |
| Sky | photos from the camera | `npm run add-photo`, which strips all metadata (GPS included) and refuses to write if any survives |

Each workflow commits and deploys only when its data changed.

## Commands

```sh
npm run dev              # local dev: http://localhost:4321
npm test                 # node --test over scripts/*.test.mjs
npm run build            # static output to dist/
npm run add-photo -- <image> --title "…" --location "…" --exif-from <raw frame>   # add a /sky photo
npm run sync-posts       # pull Published posts from Notion (needs NOTION_TOKEN)
npm run sync-hardcover   # pull the shelf from Hardcover (needs HARDCOVER_TOKEN)
firebase deploy --only hosting --project nasser-portfolio   # manual deploy
```

`main` auto-deploys through GitHub Actions. Pull requests get a preview channel.

## Files of interest

- `src/components/Orrery.astro`, `src/scripts/orrery/`, `src/lib/orrery.ts`: the hero solar system; the pure rules are tested by `scripts/orrery.test.mjs`
- `src/pages/index.astro`, `src/styles/home.css`: the homepage below the hero
- `src/lib/races.ts`, `src/lib/race-story.ts`: race stats, paces, PBs, the build-up ladder, and the Mars moons
- `src/styles/global.css`: design tokens and the light and dark themes
- `scripts/add-photo.mjs`: the /sky pipeline and its privacy check
- `firebase.json`: caching headers and the 301s for retired routes (`/field`, `/coach` → `/races`; `/paper` → `/builds`), checked by `scripts/redirects.test.mjs`

## Reading: StoryGraph fallback

A StoryGraph export can still replace the shelf by hand. Running it hands ownership of the snapshot to StoryGraph; the Hardcover sync then waits until it runs once with `-f takeover=true`. To import, open [Export your library](https://app.thestorygraph.com/user-export), download a new CSV, then run `npm run import-storygraph -- "C:/path/to/export.csv" nasser1931`. The importer validates the file before writing, keeps partial read dates and decimal ratings, and leaves out reviews, custom tags, owned-only records, and DNF books. Keep the raw export outside the repository.

## Credits

Planet, ring, and sun textures by [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0, based on NASA imagery.
