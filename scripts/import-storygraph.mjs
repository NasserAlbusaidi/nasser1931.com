#!/usr/bin/env node
// Import an official StoryGraph CSV. No account password, cookie, or private
// export URL is stored. Reviews, tags, owned books, and unshelved rows stay out.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';

const REQUIRED = ['Title', 'Authors', 'Read Status', 'Last Date Read', 'Star Rating'];
const HEADER_ERROR = 'Not a supported StoryGraph library export: required columns are missing or duplicated.';
const STATUS = { read: 'Finished', 'currently-reading': 'Reading', 'to-read': 'Want to Read' };
const FORMATS = { audio: 'Audiobook', digital: 'Ebook', paperback: 'Paperback', hardcover: 'Hardcover' };

export function normalizeDate(value) {
  if (!value?.trim()) return null;
  const normalized = value.trim().replaceAll('/', '-');
  if (!/^\d{4}(?:-\d{2}){0,2}$/.test(normalized)) throw new Error('Unrecognized StoryGraph date format.');
  const [year, month = '01', day = '01'] = normalized.split('-');
  const parsed = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) {
    throw new Error('Invalid date in StoryGraph export.');
  }
  return normalized; // Keep year/month precision; never invent a day.
}

export function parseStoryGraph(csv, { username, importedAt = new Date().toISOString() } = {}) {
  if (!/^[a-z0-9_]{3,30}$/.test(username ?? '')) throw new Error('Provide a valid StoryGraph username.');
  if (!Number.isFinite(Date.parse(importedAt))) throw new Error('Invalid import timestamp.');
  let rows;
  try { rows = parse(csv, {
    bom: true, trim: true, skip_empty_lines: true, max_record_size: 1024 * 1024,
    columns(headers) {
      if (new Set(headers).size !== headers.length || REQUIRED.some(name => !headers.includes(name))) {
        throw new Error(HEADER_ERROR);
      }
      return headers;
    },
  }); } catch (error) {
    // csv-parse errors can quote entire fields, including private reviews.
    if (error.message === HEADER_ERROR) throw new Error(HEADER_ERROR);
    const code = typeof error.code === 'string' && /^[A-Z][A-Z0-9_]+$/.test(error.code) ? error.code : 'INVALID_CSV';
    const location = Number.isInteger(error.lines) ? ` at line ${error.lines}` : '';
    throw new Error(`Cannot parse StoryGraph export (${code}${location}). Download a fresh CSV and try again.`);
  }
  const books = [];
  for (const row of rows) {
    const rawStatus = row['Read Status'];
    if (!rawStatus || rawStatus === 'did-not-finish') continue;
    if (!Object.hasOwn(STATUS, rawStatus)) throw new Error('Unsupported reading status in StoryGraph export.');
    if (!row.Title?.trim()) throw new Error('A shelved book is missing its title.');
    const ratingText = row['Star Rating'];
    const rating = ratingText ? Number(ratingText) : null;
    if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 5)) throw new Error('Invalid star rating in StoryGraph export.');
    const finished = rawStatus === 'read' ? normalizeDate(row['Last Date Read']) : null;
    const range = row['Dates Read']?.match(/(\d{4}(?:\/\d{2}){0,2})-(\d{4}(?:\/\d{2}){0,2})$/);
    const started = range && finished && normalizeDate(range[2]) === finished ? normalizeDate(range[1]) : null;
    books.push({
      title: row.Title.trim(), author: row.Authors?.trim() || null,
      status: STATUS[rawStatus], rating, format: FORMATS[row.Format] ?? (row.Format || null),
      genres: [], started, finished,
    });
  }
  if (!books.length) throw new Error('Export contains no reading-list books; the existing snapshot was not replaced.');
  const sortBooks = (a, b) => (b.finished ?? '').localeCompare(a.finished ?? '') || a.title.localeCompare(b.title, 'en');
  const finished = books.filter(book => book.status === 'Finished').sort(sortBooks);
  return {
    source: 'storygraph', source_method: 'csv', profile_url: `https://app.thestorygraph.com/profile/${username}`,
    updated: importedAt,
    stats: { finished_total: finished.length, finished_this_year: finished.filter(book => book.finished?.slice(0, 4) === importedAt.slice(0, 4)).length },
    currently_reading: books.filter(book => book.status === 'Reading').sort(sortBooks),
    finished,
    want_to_read: books.filter(book => book.status === 'Want to Read').sort(sortBooks),
  };
}

export function importStoryGraph(input, username, output = path.resolve('src/data/reading.json')) {
  const snapshot = parseStoryGraph(fs.readFileSync(input, 'utf8'), { username });
  let previous;
  try { previous = JSON.parse(fs.readFileSync(output, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const content = value => JSON.stringify({ ...value, updated: undefined });
  if (previous && content(previous) === content(snapshot)) return { changed: false, snapshot: previous };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temporary = `${output}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(snapshot, null, 2) + '\n');
    fs.renameSync(temporary, output);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return { changed: true, snapshot };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, username] = process.argv.slice(2);
  if (!input || !username) {
    console.error('Usage: npm run import-storygraph -- <export.csv> <username>');
    process.exitCode = 1;
  } else {
    try {
      const { changed, snapshot } = importStoryGraph(input, username);
      console.log(`${changed ? 'Imported' : 'Unchanged'} StoryGraph library: ${snapshot.currently_reading.length} reading, ${snapshot.finished.length} finished, ${snapshot.want_to_read.length} to read.`);
    } catch (error) { console.error(`StoryGraph import failed: ${error.message}`); process.exitCode = 1; }
  }
}
