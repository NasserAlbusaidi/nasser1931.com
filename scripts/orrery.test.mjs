import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_DISTANCE, UNDATED_DAYS, MAX_MOONS, agoLabel, bodySize, buildOrrery, daysSince, fitDistance, latestDate, motion, orbitSpeed } from '../src/lib/orrery.ts';

const near = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} is not within ${epsilon} of ${expected}`);
const NOW = Date.UTC(2026, 8, 29);

test('body size grows with the square root of what is in the section', () => {
	for (const [count, size] of [[0, 0.28], [1, 0.41], [4, 0.54], [11, 0.28 + 0.13 * Math.sqrt(11)], [30, 0.28 + 0.13 * Math.sqrt(30)]]) near(bodySize(count), size);
	assert.equal(bodySize(-3), 0.28);
});

test('orbit speed is fast when fresh and settles to a slow drift when stale', () => {
	near(orbitSpeed(0), 0.32);
	near(orbitSpeed(45), 0.32 * (0.14 + 0.86 / Math.E));
	assert.ok(orbitSpeed(2) > orbitSpeed(30));
	assert.ok(orbitSpeed(30) > orbitSpeed(200));
	assert.ok(orbitSpeed(10_000) > 0.32 * 0.14 - 1e-9 && orbitSpeed(10_000) < 0.32 * 0.14 + 1e-6);
	assert.equal(orbitSpeed(-5), orbitSpeed(0));
});

test('days since counts whole UTC days and refuses dates it cannot read', () => {
	for (const [iso, days] of [['2026-09-29', 0], ['2026-09-28', 1], ['2026-09-27', 2], ['2026-06-13', 108], ['2026-09-30', 0]]) assert.equal(daysSince(iso, NOW), days, iso);
	assert.equal(daysSince('2026-09-29T05:44:47.541Z', NOW), 0);
	assert.equal(daysSince(null, NOW), null);
	assert.equal(daysSince('not a date', NOW), null);
});

test('motion uses the real age, and a documented default when the source has no date', () => {
	const fresh = motion('2026-09-28', NOW);
	const stale = motion('2026-02-14', NOW);
	assert.equal(fresh.days, 1);
	assert.equal(stale.days, 227);
	assert.ok(fresh.speed > stale.speed * 2);
	const undated = motion(null, NOW);
	assert.equal(undated.days, null);
	near(undated.speed, orbitSpeed(UNDATED_DAYS));
	assert.deepEqual(motion('garbage', NOW), undated);
});

test('age labels read like the rest of the site', () => {
	for (const [days, label] of [[0, 'today'], [1, 'yesterday'], [2, '2 days ago'], [59, '59 days ago'], [60, '2 months ago'], [227, '8 months ago']]) assert.equal(agoLabel(days), label);
});

test('latest date ignores empty and partial dates', () => {
	assert.equal(latestDate(['2026-02-14', null, '2026', '2026-09', '2026-09-25', '2025-12-01']), '2026-09-25');
	assert.equal(latestDate([null, '2026']), null);
	assert.equal(latestDate([]), null);
});

const input = {
	projects: { count: 11, changed: '2026-09-27', moons: [{ name: 'Rihla', note: 'Available on iOS and Android' }, { name: "Einstein's Travel Bureau", note: 'Interactive physics playground' }] },
	races: [
		{ name: 'Muscat 70.3', date: '2026-02-14', status: 'finished' },
		{ name: 'Athiba Triathlon', date: '2026-01-31', status: 'finished' },
		{ name: 'Missed Swim', date: '2026-01-10', status: 'dns' },
	],
	notes: { count: 1, changed: '2026-04-26' },
	reading: { count: 30, changed: '2026-09-25', current: { title: 'Cibola Burn', progress: 50 }, series: { name: 'The Expanse', done: 3.5, total: 9 } },
	sky: { count: 1, changed: '2026-06-13', latestTitle: 'Milky Way over Jabal Al Sarah' },
};

test('site data becomes one body per section, linked to its page', () => {
	const { bodies, sky } = buildOrrery(input);
	const byKey = Object.fromEntries(bodies.map((body) => [body.key, body]));
	assert.deepEqual(bodies.map((body) => [body.key, body.href]), [['sun', '/'], ['earth', '/builds'], ['mars', '/races'], ['notes', '/stupidshit'], ['saturn', '/reading']]);
	assert.equal(sky.href, '/sky');
	near(byKey.earth.radius, bodySize(11));
	near(byKey.mars.radius, bodySize(3));
	near(byKey.saturn.radius, bodySize(30));
	assert.equal(byKey.notes.radius, 0.2);
	assert.equal(byKey.notes.kind, 'rock');
	assert.deepEqual(byKey.saturn.stats, ['30 books', 'Reading: Cibola Burn · 50%']);
	assert.deepEqual(byKey.notes.stats, ['1 note']);
	assert.deepEqual(byKey.mars.stats, ['3 races']);
	assert.deepEqual(sky.stats, ['1 photo', 'Latest: Milky Way over Jabal Al Sarah']);
});

test('each section reports the date its own data last changed', () => {
	const { bodies, sky } = buildOrrery(input);
	assert.deepEqual(Object.fromEntries(bodies.map((body) => [body.key, body.changed])), { sun: null, earth: '2026-09-27', mars: '2026-02-14', notes: '2026-04-26', saturn: '2026-09-25' });
	assert.equal(sky.changed, '2026-06-13');
});

test('moons: featured projects around Earth, races around Mars, newest first', () => {
	const { bodies } = buildOrrery(input);
	assert.deepEqual(bodies.find((body) => body.key === 'earth').moons.map((moon) => moon.name), ['Rihla', "Einstein's Travel Bureau"]);
	assert.deepEqual(bodies.find((body) => body.key === 'mars').moons, [
		{ name: 'Muscat 70.3', note: '14 Feb 2026 · finished' },
		{ name: 'Athiba Triathlon', note: '31 Jan 2026 · finished' },
		{ name: 'Missed Swim', note: '10 Jan 2026 · did not start' },
	]);
	for (const key of ['sun', 'notes', 'saturn']) assert.deepEqual(buildOrrery(input).bodies.find((body) => body.key === key).moons, []);
});

test('a long race log keeps only the newest moons but still sizes Mars by the full count', () => {
	const races = Array.from({ length: 10 }, (_, i) => ({ name: `Race ${i}`, date: `2026-01-${String(20 - i).padStart(2, '0')}`, status: 'finished' }));
	const mars = buildOrrery({ ...input, races }).bodies.find((body) => body.key === 'mars');
	assert.equal(mars.moons.length, MAX_MOONS);
	assert.equal(mars.moons[0].name, 'Race 0');
	near(mars.radius, bodySize(10));
});

test('the ring traces the current series, and is absent without one', () => {
	const saturn = (reading) => buildOrrery({ ...input, reading: { ...input.reading, ...reading } }).bodies.find((body) => body.key === 'saturn');
	assert.deepEqual(saturn({}).ring, { name: 'The Expanse', done: 3.5, total: 9 });
	assert.match(saturn({}).why, /The Expanse: 9 segments, 3 read/);
	assert.equal(saturn({ series: null }).ring, null);
	assert.deepEqual(saturn({ current: null }).stats, ['30 books']);
	assert.deepEqual(saturn({ current: { title: 'Drive', progress: null } }).stats, ['30 books', 'Reading: Drive']);
});

test('missing dates stay missing, and empty sections still build', () => {
	const empty = { projects: { count: 0, changed: null, moons: [] }, races: [], notes: { count: 0, changed: null }, reading: { count: 0, changed: null, current: null, series: null }, sky: { count: 0, changed: null, latestTitle: null } };
	const { bodies, sky } = buildOrrery(empty);
	assert.equal(bodies.length, 5);
	assert.ok(bodies.filter((body) => body.key !== 'sun').every((body) => body.changed === null));
	assert.equal(sky.changed, null);
	assert.deepEqual(bodies.find((body) => body.key === 'mars').stats, ['0 races']);
	assert.deepEqual(sky.stats, ['0 photos']);
	near(motion(bodies[1].changed, NOW).speed, orbitSpeed(UNDATED_DAYS));
});

test('camera distance grows on a narrow canvas so the outer ring is never clipped', () => {
	const fov = 40;
	const extent = 8.7 + 0.99 * 2.5;
	const seen = (dist, aspect) => dist * Math.tan((fov * Math.PI) / 360) * Math.min(aspect, 1);
	for (const aspect of [1.6, 1, 0.75, 0.5]) assert.ok(seen(fitDistance(aspect, fov, extent), aspect) >= extent, `aspect ${aspect}`);
	assert.equal(fitDistance(2, fov, 4), HOME_DISTANCE);
	assert.ok(fitDistance(0.5, fov, extent) > fitDistance(1, fov, extent));
	assert.equal(fitDistance(1, fov, extent), fitDistance(1.6, fov, extent));
	assert.equal(fitDistance(0, fov, extent), HOME_DISTANCE);
	assert.equal(fitDistance(1, fov, 0), HOME_DISTANCE);
});
