import test from 'node:test';
import assert from 'node:assert/strict';
import { INNER_ORBIT, MARS_RADIUS, OUTER_ORBIT, gapLabel, kmRaced, ladder, marsMoons } from '../src/lib/race-story.ts';

const race = (date, name, splits, status = 'finished') => ({ date, name, kind: 'Triathlon', distance: '', status, total: null, splits });
const leg = (name, km, seconds = 600) => ({ leg: name, time: '10:00', seconds, ...(km == null ? {} : { km }) });
const sprint = race('2025-11-15', 'Sprint', [leg('Swim', 0.9), leg('T1'), leg('Bike', 21), leg('T2'), leg('Run', 5)]);
const run = race('2025-12-20', 'Run', [leg('Run', 10)]);
const swim = race('2026-01-24', 'Swim', [leg('Swim', 2.5)]);
const olympic = race('2026-01-31', 'Olympic', [leg('Swim', 1.5), leg('Bike', 40), leg('Run', 10)]);
const half = race('2026-02-14', 'Half', [leg('Swim', 1.9), leg('T1'), leg('Bike', 90), leg('T2'), leg('Run', 21.1)]);

test('km raced sums the legs with a recorded distance, never transitions', () => {
  for (const [entry, km] of [[sprint, 26.9], [half, 113], [run, 10], [race('2026-03-01', 'No km', [leg('Run', null)]), 0]]) assert.equal(kmRaced(entry), km);
});

test('gap labels count days under two weeks, then weeks', () => {
  for (const [days, label] of [[1, '1 day later'], [6, '6 days later'], [13, '13 days later'], [14, '2 weeks later'], [35, '5 weeks later']]) assert.equal(gapLabel(days), label);
});

test('ladder: oldest first, the gap since the race before, races without a distance left out', () => {
  const unknown = race('2026-01-01', 'Unknown', [leg('Run', null)], 'dns');
  const rungs = ladder([half, unknown, olympic, swim, run, sprint]);
  assert.deepEqual(rungs.map(({ race: { name }, km, gap }) => [name, km, gap]),
    [['Sprint', 26.9, null], ['Run', 10, '5 weeks later'], ['Swim', 2.5, '5 weeks later'], ['Olympic', 51.5, '7 days later'], ['Half', 113, '2 weeks later']]);
  assert.deepEqual(rungs[0].legs.map(({ leg: name }) => name), ['Swim', 'Bike', 'Run']);
  assert.deepEqual(ladder([]), []);
});

test('mars moons: farther out for longer races, newest front right, none crossing the planet', () => {
  const moons = marsMoons([half, olympic, swim, run, sprint]);
  assert.deepEqual(moons.map(({ name }) => name), ['Sprint', 'Run', 'Swim', 'Olympic', 'Half']);
  const byName = Object.fromEntries(moons.map((moon) => [moon.name, moon]));
  assert.equal(byName.Swim.rx, INNER_ORBIT);
  assert.equal(byName.Half.rx, OUTER_ORBIT);
  assert.ok(byName.Swim.rx < byName.Run.rx && byName.Run.rx < byName.Sprint.rx && byName.Sprint.rx < byName.Olympic.rx);
  assert.ok(byName.Half.newest && byName.Half.x > 0 && byName.Half.y > 0);
  assert.equal(moons.filter(({ newest }) => newest).length, 1);
  for (const moon of moons) assert.ok(Math.hypot(moon.x, moon.y) > MARS_RADIUS + 2, `${moon.name} sits on Mars`);
  for (const moon of moons) assert.ok(moon.ry > MARS_RADIUS, `${moon.name}'s orbit crosses Mars`);
});

test('mars moons: only the newest six, one race sits mid-way, no races no moons', () => {
  const many = Array.from({ length: 9 }, (_, i) => race(`2026-01-${String(10 + i).padStart(2, '0')}`, `Race ${i}`, [leg('Run', 5 + i)]));
  assert.deepEqual(marsMoons(many).map(({ name }) => name), ['Race 3', 'Race 4', 'Race 5', 'Race 6', 'Race 7', 'Race 8']);
  assert.equal(marsMoons([run])[0].rx, (INNER_ORBIT + OUTER_ORBIT) / 2);
  assert.deepEqual(marsMoons([]), []);
});
