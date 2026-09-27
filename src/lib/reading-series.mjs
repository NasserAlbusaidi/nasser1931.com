import catalog from '../data/reading-series.json' with { type: 'json' };

const normalizeTitle = value => typeof value === 'string'
  ? value.normalize('NFKC').replace(/[‘’]/g, "'").trim().replace(/\s+/g, ' ').toLowerCase()
  : '';
const normalizeAuthor = value => normalizeTitle(value).replace(/[.\s]/g, '');

function matches(title, author, book, series) {
  const normalizedTitle = normalizeTitle(title);
  const normalizedAuthor = normalizeAuthor(author);
  if (!normalizedTitle || !normalizedAuthor) return false;

  const titles = [book.title, ...(book.titleAliases ?? [])];
  const authors = book.author
    ? [book.author, ...(book.authorAliases ?? [])]
    : [series.author, ...(series.authorAliases ?? [])];
  return titles.some(candidate => normalizeTitle(candidate) === normalizedTitle)
    && authors.some(candidate => normalizeAuthor(candidate) === normalizedAuthor);
}

function progressFor(book, series, snapshot) {
  // A finished record remains completed when also listed for a reread. Each
  // work counts once; current/wanted records alone never imply completion.
  for (const [bucket, status] of [
    ['finished', 'finished'],
    ['currently_reading', 'current'],
    ['want_to_read', 'wanted'],
  ]) {
    const records = Array.isArray(snapshot?.[bucket]) ? snapshot[bucket] : [];
    const match = records.find(record => matches(record?.title, record?.author, book, series));
    if (match) return { status, matchedTitle: match.title, matchedAuthor: match.author, finishedOn: match.finished ?? null };
  }
  // An absent record means nothing about whether the owner has read it.
  return { status: 'unrecorded', matchedTitle: null, matchedAuthor: null, finishedOn: null };
}

/** Build static series progress from the imported reading buckets only. */
export function buildReadingSeries(snapshot) {
  return catalog.map(series => {
    const books = series.books.map((book, index) => ({
      ...book,
      position: index + 1,
      ...progressFor(book, series, snapshot),
    }));
    const companions = (series.companions ?? []).map(book => ({
      ...book,
      ...progressFor(book, series, snapshot),
    }));
    return {
      ...series,
      books,
      companions,
      finishedCount: books.filter(book => book.status === 'finished').length,
      currentCount: books.filter(book => book.status === 'current').length,
      wantedCount: books.filter(book => book.status === 'wanted').length,
      total: books.length,
      companionFinishedCount: companions.filter(book => book.status === 'finished').length,
    };
  });
}

/** Find a main-series book, preserving its canonical position and import match. */
export function findBookSeries(title, author, series) {
  for (const entry of series) {
    const book = entry.books.find(candidate => matches(title, author, candidate, entry));
    if (book) return { series: entry, book };
  }
  return null;
}

const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86400000;

/** "10 days", "3 weeks", "18 months": the time between two full dates, else null. */
export function gapBetween(from, to) {
  if (!FULL_DATE.test(from ?? '') || !FULL_DATE.test(to ?? '')) return null;
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
  if (days < 1) return null;
  const unit = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
  if (days < 14) return unit(days, 'day');
  if (days < 60) return unit(Math.round(days / 7), 'week');
  if (days < 730) return unit(Math.round(days / 30.44), 'month');
  return unit(Math.round(days / 365.25), 'year');
}

/**
 * The order one series was actually read in: finished main books and
 * companions by finish date. Reads on the same date share a step, because the
 * record does not say which came first. Reads without a date are only counted.
 */
export function readingRoute(track) {
  const reads = [
    ...track.books.map(book => ({ ...book, companion: false })),
    ...(track.companions ?? []).map(book => ({ ...book, companion: true })),
  ];
  const finished = reads.filter(read => read.status === 'finished');
  const dated = finished
    .filter(read => typeof read.finishedOn === 'string' && read.finishedOn)
    .sort((a, b) => a.finishedOn.localeCompare(b.finishedOn));
  const steps = [];
  for (const read of dated) {
    const last = steps.at(-1);
    if (last?.date === read.finishedOn) last.reads.push(read);
    else steps.push({ date: read.finishedOn, gap: last ? gapBetween(last.date, read.finishedOn) : null, reads: [read] });
  }
  return {
    steps,
    current: reads.filter(read => read.status === 'current'),
    undated: finished.length - dated.length,
  };
}
