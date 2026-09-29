import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_MOONS, REST_PHI, UNDATED_DAYS, agoLabel, bodyReach, bodySize, buildOrrery, daysSince, earthStartAngle, easeInOut, fitView, latestDate, motion, orbitSpeed, projectBounds, sphereDistance, systemReaches } from '../src/lib/orrery.ts';

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

const FOV = 40;
const { bodies } = buildOrrery(input);
const reaches = systemReaches(bodies);
const saturn = bodies.find((body) => body.key === 'saturn');

test('body reach covers rings and moons, and the system reaches out to the ring of Saturn', () => {
	assert.equal(bodyReach(saturn), saturn.radius * 2.5);
	assert.ok(bodyReach(bodies.find((body) => body.key === 'mars')) > bodySize(3) + 0.45);
	assert.equal(bodyReach(bodies.find((body) => body.key === 'notes')), 0.2 * 1.3);
	assert.equal(reaches.find((r) => r.orbit === saturn.orbit).reach, saturn.radius * 2.5);
});

test('projected bounds grow as the camera comes closer, and the far side is smaller than the near side', () => {
	const near = projectBounds(reaches, 25, FOV, 800);
	const far = projectBounds(reaches, 50, FOV, 800);
	assert.ok(near.right > far.right && -near.left > -far.left && near.bottom > far.bottom);
	// Seen from above the plane, the near side hangs lower than the far side rises, and the sides are even.
	assert.ok(near.bottom > -near.top);
	assert.ok(Math.abs(near.right + near.left) < 1e-6);
	assert.deepEqual(projectBounds([{ orbit: 0, reach: 1 }], 30, FOV, 800), { left: -800 / 2 / Math.tan((FOV * Math.PI) / 360) / 30, right: 800 / 2 / Math.tan((FOV * Math.PI) / 360) / 30, top: -800 / 2 / Math.tan((FOV * Math.PI) / 360) / 30, bottom: 800 / 2 / Math.tan((FOV * Math.PI) / 360) / 30 });
});

const desktop = { labelBelowPx: 46, padBottomPx: 70 };
const wide = [
	{ name: '1440x900 hero', w: 1425, h: 824, safeLeft: 537 },
	{ name: '1920x1080 hero', w: 1905, h: 960, safeLeft: 777 },
	{ name: '1024x768 hero', w: 1009, h: 692, safeLeft: 506 },
	// The hero stops growing at 960px tall, so on a very wide screen its height, not its width, limits the system.
	{ name: '2560x1440 hero', w: 2545, h: 960, safeLeft: 1100, heightLimited: true },
	{ name: '21:9 2560x1080', w: 2545, h: 1000, safeLeft: 1100, heightLimited: true },
];

test('with text on the left, the whole system fits the free area, and no closer camera would', () => {
	for (const { name, w, h, safeLeft } of wide) {
		const { dist, centerX, centerY } = fitView(w, h, FOV, reaches, REST_PHI, { safeLeft, ...desktop });
		const b = projectBounds(reaches, dist, FOV, h);
		assert.ok(centerX >= 0.6 * w - 1e-6 && centerX <= 0.75 * w + 1e-6, `${name}: sun at ${centerX / w}`);
		assert.ok(centerX + b.left >= safeLeft - 1e-6, `${name}: clears the text`);
		assert.ok(centerX + b.right <= w + 1e-6, `${name}: clears the right edge`);
		assert.ok(centerY + b.top >= 12 - 1e-6 && centerY + b.bottom + desktop.labelBelowPx <= h - desktop.padBottomPx + 1e-6, `${name}: fits vertically`);
		// Centred by its own bounds: the room above the system and below it (labels included) are equal.
		near(centerY + b.top - 12, h - desktop.padBottomPx - (centerY + b.bottom + desktop.labelBelowPx), 1e-6);
		// Tight: 2% closer would push something past a limit.
		const c = projectBounds(reaches, dist * 0.98, FOV, h);
		const spills = centerX + c.left < safeLeft || centerX + c.right > w - 16 || c.bottom - c.top + desktop.labelBelowPx > h - 12 - desktop.padBottomPx;
		assert.ok(spills || dist < 10.1, `${name}: not tight (dist ${dist})`);
	}
});

test('the outer orbit takes most of the free width, as much as the ring of Saturn allows', () => {
	for (const { name, w, h, safeLeft, heightLimited } of wide) {
		const { dist } = fitView(w, h, FOV, reaches, REST_PHI, { safeLeft, ...desktop });
		const orbitWidth = (2 * saturn.orbit * (h / 2 / Math.tan((FOV * Math.PI) / 360))) / dist;
		const share = orbitWidth / (w - 16 - safeLeft);
		assert.ok(share > (heightLimited ? 0.5 : 0.68) && share < 0.79, `${name}: ${share.toFixed(3)}`);
	}
});

test('a wider free area brings the camera closer; narrower text does too', () => {
	const dist = (w, h, safeLeft) => fitView(w, h, FOV, reaches, REST_PHI, { safeLeft, ...desktop }).dist;
	assert.ok(dist(1905, 960, 777) < dist(1009, 692, 506));
	assert.ok(dist(1425, 824, 400) <= dist(1425, 824, 700));
});

test('a phone canvas is fitted tightly around the system, with the sun centred and labels below', () => {
	for (const [w, h] of [[390, 292], [360, 270], [320, 240], [768, 576]]) {
		const { dist, centerX, centerY } = fitView(w, h, FOV, reaches, REST_PHI, { labelBelowPx: 24 });
		const b = projectBounds(reaches, dist, FOV, h);
		assert.equal(centerX, w / 2);
		assert.ok(w / 2 + b.left >= 12 - 1e-6 && w / 2 + b.right <= w - 12 + 1e-6, `${w}x${h}: sides`);
		assert.ok(centerY + b.top >= 12 - 1e-6 && centerY + b.bottom + 24 <= h - 12 + 1e-6, `${w}x${h}: top and bottom`);
		// The width decides it, so the canvas is not far taller than the system needs.
		assert.ok((b.bottom - b.top + 24) / h > 0.55, `${w}x${h}: too much empty height`);
	}
});

test('degenerate canvases fall back to the resting distance', () => {
	assert.deepEqual(fitView(0, 0, FOV, reaches), { dist: 30, centerX: 0, centerY: 0 });
	assert.equal(fitView(500, 500, FOV, []).dist, 30);
	assert.equal(fitView(500, 500, FOV, reaches, REST_PHI, { safeLeft: 500 }).centerX, 250);
});

test('easing starts and ends flat and never overshoots', () => {
	assert.equal(easeInOut(0), 0);
	assert.equal(easeInOut(1), 1);
	assert.equal(easeInOut(0.5), 0.5);
	assert.equal(easeInOut(-2), 0);
	assert.equal(easeInOut(3), 1);
	let previous = 0;
	for (let i = 1; i <= 20; i++) { const v = easeInOut(i / 20); assert.ok(v >= previous && v <= 1); previous = v; }
	assert.ok(easeInOut(0.1) < 0.1 && easeInOut(0.9) > 0.9);
});

test('a sphere placed at its start distance projects to the pixel radius asked for', () => {
	for (const [px, h, radius] of [[280, 824, 0.71], [150, 292, 0.71], [400, 960, 0.71], [60, 300, 1]]) {
		const dist = sphereDistance(px, h, FOV, radius);
		const tanEdge = radius / Math.sqrt(dist * dist - radius * radius);
		assert.ok(Math.abs((tanEdge / Math.tan((FOV * Math.PI) / 360)) * (h / 2) - px) < 1e-6, `${px}px on ${h}`);
		assert.ok(dist > radius);
	}
});

test('Earth starts with the sun to the right of the camera, a fixed angle away, and out of frame', () => {
	for (const theta of [0, 0.7, 2, -1.3]) {
		for (const offset of [0.6, 0.9]) {
			const a = earthStartAngle(theta, offset);
			const sun = [-Math.cos(a), -Math.sin(a)]; // from Earth to the sun
			const toCamera = [Math.cos(theta), Math.sin(theta)];
			const right = [Math.sin(theta), -Math.cos(theta)];
			near(sun[0] * toCamera[0] + sun[1] * toCamera[1], Math.cos(offset), 1e-9);
			near(sun[0] * right[0] + sun[1] * right[1], Math.sin(offset), 1e-9);
		}
	}
});
