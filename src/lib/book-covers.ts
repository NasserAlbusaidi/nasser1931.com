import manifest from '../data/book-covers.json';

type CoverRecord = { title: string; author: string; sourceUrl: string; sourcePage: string; width: number; height: number; note?: string };
const normalize = (value: string | null) => (value ?? '').normalize('NFKC').trim().toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
const key = (title: string, author: string | null) => `${normalize(title)}|${normalize(author)}`;
const covers = new Map((manifest as CoverRecord[]).map(cover => [key(cover.title, cover.author), cover]));

// Cover curation survives reimports without changing dates, ratings, or statuses.
// All matches are explicit; no API search or title guessing runs in the browser.
export function getBookCover(title: string, author: string | null) {
  return covers.get(key(title, author)) ?? null;
}
