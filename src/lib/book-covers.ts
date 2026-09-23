import manifest from '../data/book-covers.json';
import cached from '../data/cover-cache.json';

type CoverRecord = { title: string; author: string; sourceUrl: string; sourcePage: string; width: number; height: number; note?: string };
type CachedCover = { path: string; width: number; height: number; color: string };
const normalize = (value: string | null) => (value ?? '').normalize('NFKC').trim().toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
const key = (title: string, author: string | null) => `${normalize(title)}|${normalize(author)}`;
const covers = new Map((manifest as CoverRecord[]).map(cover => [key(cover.title, cover.author), cover]));
const cache = cached as Record<string, CachedCover>;

// Cover curation survives reimports without changing dates, ratings, or statuses.
// All matches are explicit; no API search or title guessing runs in the browser.
// A synced source (Hardcover) may supply its own cover URL; the curated manifest wins.
// scripts/cache-covers.mjs mirrors covers to /covers/ so pages don't hot-link.
export function getBookCover(title: string, author: string | null, sourceUrl?: string | null) {
  const curated = covers.get(key(title, author));
  const url = curated?.sourceUrl ?? sourceUrl ?? null;
  if (!url) return null;
  const local = cache[url];
  if (local) return { src: local.path, width: local.width, height: local.height, color: local.color, local: true };
  return { src: url, width: curated?.width ?? 400, height: curated?.height ?? 600, color: null, local: false };
}
