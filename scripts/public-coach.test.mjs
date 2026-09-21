import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPublicForecast } from '../src/lib/public-coach.mjs';
import { classifyState, getScheduleContext, pickWorkout, pickWorkoutV1 } from '../src/scripts/cycling-engine.mjs';
const bank = JSON.parse(readFileSync(new URL('../src/data/workout-bank.json', import.meta.url), 'utf8'));
const snapshot = { _today: '2026-09-21', wellness: {}, computed: {} };

test('rest and group days remain useful, distinct recommendations', () => {
  const rest = buildPublicForecast(snapshot, bank);
  assert.equal(rest.length, 4);
  assert.equal(rest[0].kind, 'rest');
  assert.ok(rest[0].description.length > 30);
  assert.equal(rest[0].duration, null);
  assert.equal(buildPublicForecast({ ...snapshot, _today: '2026-09-25' }, bank)[0].kind, 'group');
});

test('recorded and projected sessions match the canonical engine', () => {
  const input = { ...snapshot, _today: '2026-09-23' };
  const entries = buildPublicForecast(input, bank);
  const context = getScheduleContext(new Date(input._today + 'T00:00:00Z'));
  const pick = pickWorkout(classifyState(input.wellness).state, context, bank, input.computed);
  assert.equal(entries[0].title, pick.workout.name);
  assert.equal(entries[0].duration, pick.workout.duration_min);
  for (const entry of entries.slice(1)) {
    const projected = pickWorkoutV1('amber', getScheduleContext(new Date(entry.date + 'T00:00:00Z')), bank);
    assert.equal(entry.projected, true);
    if (projected.workout) assert.equal(entry.title, projected.workout.name);
  }
});

test('invalid snapshots and missing workouts never invent a rest day', () => {
  for (const date of [undefined, '', 'bad', '2026-02-30']) {
    assert.deepEqual(buildPublicForecast({ ...snapshot, _today: date }, bank), []);
  }
  assert.equal(buildPublicForecast({ ...snapshot, _today: '2026-09-23' }, {})[0].kind, 'unavailable');
});

test('public output contains only approved fields and omits null or invalid targets', () => {
  const keys = ['date','description','duration','kind','label','projected','targetIf','targetTss','title'];
  const input = { ...snapshot, wellness: { hrv: 123456, private_note: 'PRIVATE_SENTINEL' }, computed: { private_note: 'PRIVATE_SENTINEL' } };
  const output = buildPublicForecast(input, bank);
  for (const entry of output) assert.deepEqual(Object.keys(entry).sort(), keys);
  assert.doesNotMatch(JSON.stringify(output), /PRIVATE_SENTINEL|123456|wellness|reasoning|warnings/);
  const missingTargets = Object.fromEntries(Object.entries(bank).map(([key, value]) => [key, { ...value, duration_min: NaN, target_if: null, target_tss: Infinity }]));
  const entry = buildPublicForecast({ ...snapshot, _today: '2026-09-23' }, missingTargets)[0];
  assert.equal(entry.duration, null);
  assert.equal(entry.targetIf, null);
  assert.equal(entry.targetTss, null);
});
