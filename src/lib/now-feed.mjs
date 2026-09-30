// The homepage "In orbit now" feed: the newest item from each section, newest
// first, each tagged with the body that stands for its section in the orrery.
// Only dated items are ordered by date; an undated one (a book in progress)
// goes last rather than being given a date it does not have.

/** Notes tagged `meta` (the welcome post) are not promoted on the homepage. */
export const promotedNotes = (notes) => notes.filter((note) => !(note.tags ?? []).includes('meta'))
  .sort((a, b) => b.date.localeCompare(a.date));

/**
 * @param {{ notes?: {title: string, date: string, href: string, tags?: string[]}[],
 *   sky?: {title: string, date: string, href: string} | null,
 *   nextRace?: {name: string, date: string} | null,
 *   lastRace?: {name: string, date: string, total?: string | null} | null,
 *   book?: {title: string, author?: string | null, progress?: number | null} | null }} input
 */
export const buildNowFeed = ({ notes = [], sky = null, nextRace = null, lastRace = null, book = null }) => {
  const note = promotedNotes(notes)[0];
  const items = [
    note && { body: 'notes', section: 'Note', title: note.title, date: note.date, href: note.href },
    sky && { body: 'sky', section: 'Sky', title: sky.title, date: sky.date, href: sky.href },
    nextRace ? { body: 'mars', section: 'Racing next', title: nextRace.name, date: nextRace.date, href: '/races' }
      : lastRace && { body: 'mars', section: 'Last race', title: lastRace.total ? `${lastRace.name} · ${lastRace.total}` : lastRace.name, date: lastRace.date, href: '/races' },
    book && { body: 'saturn', section: 'Reading', title: book.title,
      detail: [book.author, book.progress == null ? null : `${Math.round(book.progress)}%`].filter(Boolean).join(' · ') || null, date: null, href: '/reading' },
  ].filter(Boolean);
  const dated = items.filter((item) => item.date).sort((a, b) => b.date.localeCompare(a.date));
  return [...dated, ...items.filter((item) => !item.date)];
};
