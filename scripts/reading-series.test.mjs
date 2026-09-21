import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReadingSeries, findBookSeries } from '../src/lib/reading-series.mjs';

const book = (title, author) => ({ title, author });
const getSeries = (reading, id) => buildReadingSeries(reading).find(series => series.id === id);

test('current imported books and companions do not inflate main-novel completion', () => {
  const series = buildReadingSeries({
    finished: ['Leviathan Wakes', "Caliban's War", 'Drive'].map(title => book(title, 'James S.A. Corey')),
    currently_reading: [book("Abaddon's Gate", 'James S.A. Corey')],
  });
  const expanse = series.find(series => series.id === 'the-expanse');
  assert.equal(expanse.finishedCount, 2);
  assert.equal(expanse.currentCount, 1);
  assert.equal(expanse.wantedCount, 0);
  assert.equal(expanse.total, 9);
  assert.equal(expanse.companionFinishedCount, 1);
  const match = findBookSeries("Abaddon's Gate", 'James S.A. Corey', series);
  assert.equal(match.book.position, 3);
  assert.equal(match.book.status, 'current');
  assert.equal(match.book.matchedTitle, "Abaddon's Gate");
  assert.equal(match.book.matchedAuthor, 'James S.A. Corey');
});

test('matches explicit title aliases and author initials while retaining imported labels', () => {
  const series = buildReadingSeries({ finished: [
    book('We Are Legion', 'Dennis E Taylor'),
    book('  Caliban’s   War ', 'James S. A. Corey'),
    book('A Game of Thrones', 'George RR Martin'),
  ] });
  const bob = findBookSeries('We Are Legion', 'Dennis E. Taylor', series);
  assert.equal(bob.book.title, 'We Are Legion (We Are Bob)');
  assert.equal(bob.book.matchedTitle, 'We Are Legion');
  assert.equal(bob.book.status, 'finished');
  assert.equal(findBookSeries("Caliban's War", 'James S.A. Corey', series).book.status, 'finished');
  assert.equal(findBookSeries('A Game of Thrones', 'George R.R. Martin', series).book.status, 'finished');
});

test('a homonymous work, missing author, or unlisted subtitle does not count', () => {
  const dune = getSeries({ finished: [
    book('Dune', 'Another Author'),
    book('Dune Messiah', null),
    book('Children of Dune: An Unverified Adaptation', 'Frank Herbert'),
  ] }, 'dune');
  assert.equal(dune.finishedCount, 0);
  assert.ok(dune.books.every(book => book.status === 'unrecorded' && book.matchedTitle === null));
  assert.equal(findBookSeries('Dune', 'Another Author', [dune]), null);
  assert.equal(findBookSeries('Dune', null, [dune]), null);
});

test('overlapping buckets and duplicate editions count each completed work once', () => {
  const duneBook = book('Dune', 'Frank Herbert');
  const duneMessiah = book('Dune Messiah', 'Frank Herbert');
  const dune = getSeries({
    finished: [duneBook, duneBook],
    currently_reading: [duneBook, duneMessiah],
    want_to_read: [duneBook, duneMessiah, book('Children of Dune', 'Frank Herbert')],
  }, 'dune');
  assert.equal(dune.finishedCount, 1);
  assert.equal(dune.currentCount, 1);
  assert.equal(dune.wantedCount, 1);
  assert.deepEqual(dune.books.map(book => book.status), [
    'finished', 'current', 'wanted', 'unrecorded', 'unrecorded', 'unrecorded',
  ]);
});

test('missing snapshot buckets never imply finished or wanted books and input stays unchanged', () => {
  const input = { currently_reading: [book("Abaddon's Gate", 'James S.A. Corey')] };
  const before = structuredClone(input);
  assert.equal(getSeries(input, 'the-expanse').finishedCount, 0);
  assert.deepEqual(input, before);
  for (const series of buildReadingSeries(null)) {
    assert.equal(series.finishedCount + series.currentCount + series.wantedCount, 0);
    assert.ok(series.books.every(book => book.status === 'unrecorded'));
  }
});

test('companion author aliases match joint authors without changing novel denominators', () => {
  const fire = getSeries({ finished: [
    book('The World of Ice & Fire', 'Linda Antonsson, Elio M. García Jr., George R.R. Martin'),
    book('Fire & Blood: 300 Years Before a Game of Thrones', 'George R.R. Martin'),
  ] }, 'a-song-of-ice-and-fire');
  assert.equal(fire.finishedCount, 0);
  assert.equal(fire.total, 5);
  assert.equal(fire.companionFinishedCount, 2);
  assert.equal(findBookSeries('Fire & Blood', 'George R.R. Martin', [fire]), null);
});
