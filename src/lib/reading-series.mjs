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
    if (match) return { status, matchedTitle: match.title, matchedAuthor: match.author };
  }
  // An absent record means nothing about whether the owner has read it.
  return { status: 'unrecorded', matchedTitle: null, matchedAuthor: null };
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
