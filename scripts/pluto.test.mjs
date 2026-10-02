import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { KNOCKS, KNOCK_GAP_MS, KONAMI, NAME, ROOM, WAYS, foundWays, isWay, keyWatcher, knocker } from '../src/lib/pluto.mjs';

const konamiKeys = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const watch = () => keyWatcher({ konami: KONAMI, name: NAME });
const type = (watcher, keys) => keys.map((key) => watcher.feed(key)).filter(Boolean);

test('the Konami code opens the room', () => {
	assert.deepEqual(type(watch(), konamiKeys), ['konami']);
});

test('typing pluto opens the room, in any case', () => {
	assert.deepEqual(type(watch(), [...'Pluto']), ['name']);
	assert.deepEqual(type(watch(), [...'PLUTO']), ['name']);
});

test('a stray key before a sequence does not spoil it', () => {
	assert.deepEqual(type(watch(), [...'ppluto']), ['name']);
	assert.deepEqual(type(watch(), ['ArrowUp', ...konamiKeys]), ['konami']);
	assert.deepEqual(type(watch(), ['x', 'Shift', ...'pluto']), ['name']);
	assert.deepEqual(type(watch(), ['Shift', 'P', 'Shift', 'L', 'CapsLock', ...'UTO']), ['name']);
});

test('a broken sequence does not open the room', () => {
	assert.deepEqual(type(watch(), [...'plutp']), []);
	assert.deepEqual(type(watch(), konamiKeys.slice(0, -1)), []);
	assert.deepEqual(type(watch(), [...'plu', 'x', 'to']), []);
});

test('a match resets, so the same keys must be typed again', () => {
	const watcher = watch();
	assert.deepEqual(type(watcher, [...'plutoo']), ['name']);
	assert.deepEqual(type(watcher, [...'pluto']), ['name']);
});

test('junk keys are ignored', () => {
	const watcher = watch();
	assert.equal(watcher.feed(undefined), null);
	assert.equal(watcher.feed(''), null);
});

test('nine knocks in a row on the Sun open the room', () => {
	const sun = knocker();
	const results = Array.from({ length: KNOCKS }, (_, i) => sun.knock(i * 1000));
	assert.deepEqual(results, [...Array(KNOCKS - 1).fill(false), true]);
});

test('a pause between knocks starts the count again', () => {
	const sun = knocker();
	let time = 0;
	for (let i = 0; i < KNOCKS - 1; i++) sun.knock((time += 1000));
	time += KNOCK_GAP_MS + 1;
	assert.equal(sun.knock(time), false);
	for (let i = 0; i < KNOCKS - 2; i++) assert.equal(sun.knock((time += 1000)), false);
	assert.equal(sun.knock((time += 1000)), true);
});

test('a knock on anything else breaks the run', () => {
	const sun = knocker();
	for (let i = 1; i < KNOCKS; i++) sun.knock(i * 100);
	sun.reset();
	assert.equal(sun.knock(KNOCKS * 100), false);
});

test('found ways keep the room order and drop anything unknown', () => {
	assert.deepEqual(foundWays(['lost', 'konami', 'nonsense'], 'sun'), ['konami', 'sun', 'lost']);
	assert.deepEqual(foundWays(null, 'name'), ['name']);
	assert.deepEqual(foundWays('konami', null), []);
	assert.deepEqual(foundWays(['konami', 'konami'], 'konami'), ['konami']);
	assert.ok(isWay('console'));
	assert.ok(!isWay('address'));
});

test('every way has a hint, a label, and a way to say it', () => {
	assert.equal(new Set(WAYS.map((way) => way.id)).size, WAYS.length);
	for (const way of WAYS) assert.ok(way.hint && way.label && way.via, way.id);
});

// The room is hidden: it exists, but nothing indexes or links it.
test('the room has a page, kept out of search and the sitemap', () => {
	assert.ok(existsSync(new URL(`../src/pages${ROOM}.astro`, import.meta.url)));
	const page = readFileSync(new URL(`../src/pages${ROOM}.astro`, import.meta.url), 'utf8');
	assert.match(page, /noindex/);
	const config = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
	assert.match(config, /filter:.*'\/pluto'/);
	const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
	assert.doesNotMatch(robots, /pluto/i, 'robots.txt would advertise the room');
	const nav = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
	assert.doesNotMatch(nav, /pluto/i);
});
