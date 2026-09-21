import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseStoryGraph, normalizeDate, importStoryGraph } from './import-storygraph.mjs';

const headers = ['Title', 'Authors', 'Read Status', 'Last Date Read', 'Star Rating', 'Format', 'Dates Read', 'Date Added', 'Review', 'Tags'];
const csv = rows => '\uFEFF' + [headers, ...rows].map(row => headers.map((_, index) => `"${String(row[index] ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
const options = { username: 'reader_123', importedAt: '2026-09-20T12:00:00.000Z' };

test('imports quoted titles, fractional ratings, partial dates; excludes private fields and unshelved books', () => {
  const snapshot = parseStoryGraph(csv([
    ['A title, with "quotes"', 'An Author', 'read', '2026', '4.25', 'audio', '2026/04/17-2026', '', 'Private\nreview', 'private-tag'],
    ['In progress', 'Another Author', 'currently-reading', '', '', 'digital', '', '2026/09/19'],
    ['Next', 'Writer', 'to-read'],
    ['Owned only', 'Writer', ''],
    ['Stopped', 'Writer', 'did-not-finish'],
  ]), options);
  assert.equal(snapshot.finished[0].title, 'A title, with "quotes"');
  assert.equal(snapshot.finished[0].rating, 4.25);
  assert.equal(snapshot.finished[0].finished, '2026');
  assert.equal(snapshot.finished[0].started, '2026-04-17');
  assert.equal(snapshot.currently_reading[0].started, null); // Date Added is not a start date.
  assert.equal(snapshot.currently_reading[0].rating, null);
  assert.equal(snapshot.want_to_read.length, 1);
  assert.deepEqual(snapshot.stats, { finished_total: 1, finished_this_year: 1 });
  assert.ok(!JSON.stringify(snapshot).includes('Private'));
  assert.ok(!JSON.stringify(snapshot).includes('private-tag'));
  assert.equal(snapshot.profile_url, 'https://app.thestorygraph.com/profile/reader_123');
});

test('keeps date precision and rejects invalid calendar dates', () => {
  assert.equal(normalizeDate('2026/09'), '2026-09');
  assert.equal(normalizeDate('2024/02/29'), '2024-02-29');
  assert.equal(normalizeDate(''), null);
  assert.throws(() => normalizeDate('2026/02/29'));
  assert.throws(() => normalizeDate('09/20/2026'));
});

test('rejects malformed/unsupported exports instead of dropping records silently', () => {
  assert.throws(() => parseStoryGraph('Title,Authors\nBook,Writer', options), /required columns/);
  assert.throws(() => parseStoryGraph(csv([['Book', 'Writer', 'future-status']]), options), /Unsupported reading status/);
  assert.throws(() => parseStoryGraph(csv([['Book', 'Writer', 'read', '', 'six']]), options), /Invalid star rating/);
  assert.throws(() => parseStoryGraph(csv([['', 'Writer', 'read']]), options), /missing its title/);
  assert.throws(() => parseStoryGraph(csv([['Owned', 'Writer', '']]), options), /no reading-list books/);
});

test('orders dated reads before partial and undated records', () => {
  const result = parseStoryGraph(csv([
    ['No date', 'Writer', 'read'], ['Year only', 'Writer', 'read', '2026'],
    ['Earlier', 'Writer', 'read', '2026/05/01'], ['Latest', 'Writer', 'read', '2026/09/17'],
  ]), options);
  assert.deepEqual(result.finished.map(book => book.title), ['Latest', 'Earlier', 'Year only', 'No date']);
});

test('CSV errors do not disclose an excluded private review', () => {
  const malformed = 'Title,Authors,Read Status,Last Date Read,Star Rating,Review\nBook,Writer,read,,,private-secret"bad';
  assert.throws(() => parseStoryGraph(malformed, options), error => {
    assert.match(error.message, /Cannot parse StoryGraph export/);
    assert.ok(!error.message.includes('private-secret'));
    return true;
  });
});

test('repeat import is idempotent and bad input leaves existing snapshot intact', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'storygraph-import-test-'));
  const input = path.join(directory, 'input.csv');
  const output = path.join(directory, 'reading.json');
  try {
    fs.writeFileSync(input, csv([['Book', 'Writer', 'read', '2026/09/20', '5']]));
    assert.equal(importStoryGraph(input, 'reader_123', output).changed, true);
    const before = fs.readFileSync(output, 'utf8');
    assert.equal(importStoryGraph(input, 'reader_123', output).changed, false);
    assert.equal(fs.readFileSync(output, 'utf8'), before);
    fs.writeFileSync(input, 'not,a,library');
    assert.throws(() => importStoryGraph(input, 'reader_123', output));
    assert.equal(fs.readFileSync(output, 'utf8'), before);
  } finally {
    for (const file of [input, output, `${output}.tmp`]) if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(directory);
  }
});
