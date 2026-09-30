import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNowFeed, promotedNotes } from '../src/lib/now-feed.mjs';

const welcome = { title: 'Welcome', date: '2026-04-26', href: '/stupidshit/hello', tags: ['meta'] };
const note = { title: 'Rebuilding a timelapse', date: '2026-09-30', href: '/stupidshit/timelapse', tags: ['note'] };
const sky = { title: 'Two in the morning', date: '2026-06-13', href: '/sky#x' };
const lastRace = { name: 'Muscat 70.3', date: '2026-02-14', total: '6:19:13' };
const book = { title: 'Cibola Burn', author: 'James S. A. Corey', progress: 50 };

const cases = [
  ['newest first, undated book last', { notes: [welcome, note], sky, lastRace, book },
    [['Note', 'Rebuilding a timelapse'], ['Sky', 'Two in the morning'], ['Last race', 'Muscat 70.3 · 6:19:13'], ['Reading', 'Cibola Burn']]],
  ['the welcome post is never promoted', { notes: [welcome], sky }, [['Sky', 'Two in the morning']]],
  ['a race on the calendar replaces the last result', { nextRace: { name: 'Salalah 70.3', date: '2026-11-20' }, lastRace },
    [['Racing next', 'Salalah 70.3']]],
  ['a race with no total keeps its name only', { lastRace: { name: 'OMSwim', date: '2026-01-10', total: null } }, [['Last race', 'OMSwim']]],
  ['nothing recorded, nothing shown', {}, []],
];

for (const [label, input, expected] of cases) {
  test(`now feed: ${label}`, () => assert.deepEqual(buildNowFeed(input).map(({ section, title }) => [section, title]), expected));
}

test('now feed: a book carries author and progress, and no invented date', () => {
  const [item] = buildNowFeed({ book });
  assert.equal(item.detail, 'James S. A. Corey · 50%');
  assert.equal(item.date, null);
  assert.equal(buildNowFeed({ book: { title: 'Dune', author: null, progress: null } })[0].detail, null);
});

test('promoted notes drop meta posts and sort newest first', () => {
  const older = { ...note, title: 'Older', date: '2026-05-01' };
  assert.deepEqual(promotedNotes([older, welcome, note]).map(({ title }) => title), ['Rebuilding a timelapse', 'Older']);
});
