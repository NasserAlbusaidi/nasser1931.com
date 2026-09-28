import test from 'node:test';
import assert from 'node:assert/strict';
import { DARK_INK, FALLBACK_SPINES, LIGHT_INK, MIN_CONTRAST, contrast, dimmestContrast, mix, spineColors } from '../src/lib/spine-colors.mjs';

// clean: already passes, left alone; warning: mid-tone cover, shaded; error: the worst mid-tones.
const cases = [
  ['dark navy cover, unchanged', '#1B2233', LIGHT_INK, true],
  ['pale cover, unchanged', '#EDE3C8', DARK_INK, true],
  ['mid green cover (Lighthouse: 3.71)', '#516D30', LIGHT_INK, false],
  ['mid grey cover', '#777777', null, false],
  ['saturated red cover', '#C0392B', null, false],
  ['mid blue cover', '#4F7CAC', null, false],
];

for (const [label, base, expectedInk, unchanged] of cases) {
  test(`spine colours: ${label}`, () => {
    const { spine, ink } = spineColors(base);
    if (expectedInk) assert.equal(ink, expectedInk);
    assert.ok(dimmestContrast(spine, ink) >= MIN_CONTRAST, `${spine} with ${ink}: ${dimmestContrast(spine, ink).toFixed(2)}`);
    assert.ok(contrast(spine, ink) >= MIN_CONTRAST);
    if (unchanged) assert.equal(spine, base.toUpperCase());
    else assert.notEqual(spine, base.toUpperCase());
  });
}

test('the old rule failed the mid green cover', () => {
  assert.ok(dimmestContrast('#516D30', LIGHT_INK) < MIN_CONTRAST);
});

test('every fallback palette colour passes', () => {
  for (const base of FALLBACK_SPINES) {
    const { spine, ink } = spineColors(base);
    assert.ok(dimmestContrast(spine, ink) >= MIN_CONTRAST, base);
  }
});

test('opacity blending matches the browser', () => {
  assert.equal(mix('#FFFFFF', '#000000', 0.5), '#808080');
  assert.equal(mix(LIGHT_INK, '#516D30', 1), LIGHT_INK);
});
