import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import exifr from 'exifr';
import sharp from 'sharp';
import { cameraDate, exportPhoto, parseStack, renderEntry, slugify } from './add-photo.mjs';
import { captureLine, formatShutter, newestFirst } from '../src/lib/sky.mjs';

const work = mkdtempSync(join(tmpdir(), 'add-photo-'));
test.after(() => rmSync(work, { recursive: true, force: true }));

const makeJpeg = async (name, exif) => {
  const file = join(work, name);
  let image = sharp({ create: { width: 64, height: 48, channels: 3, background: '#0a1020' } }).jpeg();
  if (exif) image = image.withExif(exif);
  await image.toFile(file);
  return file;
};

// The repository is public, so no exported photo may keep location or camera data.
const privacyCases = [
  ['GPS and camera tags', { IFD0: { Make: 'SONY', Model: 'ILCE-7M4' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '23/1 5/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '57/1 30/1 0/1' } }],
  ['camera tags only', { IFD0: { Make: 'SONY', Model: 'ILCE-7M4', Software: 'Lightroom' } }],
  ['no metadata', null],
];

for (const [label, exif] of privacyCases) {
  test(`export strips metadata: ${label}`, async () => {
    const input = await makeJpeg(`${label}.jpg`, exif);
    if (exif?.IFD3) assert.ok((await exifr.gps(input))?.latitude, 'fixture should carry GPS');
    const output = join(work, `${label}-out.jpg`);
    await exportPhoto(input, output);
    assert.equal(await exifr.gps(output), undefined);
    assert.equal(await exifr.parse(output, { tiff: true, xmp: true, iptc: true }), undefined);
  });
}

test('export never enlarges and caps the width', async () => {
  const input = join(work, 'wide.tif');
  await sharp({ create: { width: 400, height: 100, channels: 3, background: '#000' } }).tiff().toFile(input);
  assert.equal((await exportPhoto(input, join(work, 'wide-out.jpg'), 200)).width, 200);
  assert.equal((await exportPhoto(input, join(work, 'wide-out2.jpg'), 1000)).width, 400);
});

test('camera dates keep the camera-local day', () => {
  assert.equal(cameraDate('2026:06:13 00:30:40'), '2026-06-13');
  assert.equal(cameraDate('2026-06-13T00:30:40'), '2026-06-13');
  assert.equal(cameraDate(undefined), null);
  assert.equal(cameraDate('garbage'), null);
});

test('stack accepts counts above 1 or "unknown"', () => {
  assert.equal(parseStack(undefined), undefined);
  assert.equal(parseStack('unknown'), 'unknown');
  assert.equal(parseStack('24'), 24);
  for (const bad of ['1', '0', '2.5', 'many']) assert.throws(() => parseStack(bad));
});

test('slugs are URL-safe', () => {
  assert.equal(slugify('Jabal Al Sarah'), 'jabal-al-sarah');
  assert.equal(slugify("  Wadi  Bani_Khalid's pools "), 'wadi-bani-khalids-pools');
});

test('entries omit fields the camera did not record', () => {
  const entry = renderEntry({ title: 'Test', date: '2026-06-13', location: 'Somewhere', exposure: { seconds: 13, aperture: undefined } });
  assert.match(entry, /exposure:\n {2}seconds: 13\n/);
  assert.doesNotMatch(entry, /aperture|stack|camera|lens/);
  assert.match(entry, /alt: "Test"/);
});

// Capture lines: never claim a frame count that was not recorded.
const captureCases = [
  ['single exposure', { exposure: { seconds: 13, aperture: 2, iso: 2500, focal_mm: 14 } }, '13 s · f/2 · ISO 2500 · 14 mm'],
  ['stack, count unknown', { exposure: { seconds: 13, aperture: 2 }, stack: 'unknown' }, 'Stacked 13 s frames · f/2'],
  ['stack with count', { exposure: { seconds: 13, iso: 2500 }, stack: 24 }, 'Stack of 24 × 13 s · ISO 2500'],
  ['nothing recorded', {}, ''],
  ['fast shutter, fractional aperture', { exposure: { seconds: 0.008, aperture: 1.8 } }, '1/125 s · f/1.8'],
];

for (const [label, input, expected] of captureCases) {
  test(`capture line: ${label}`, () => assert.equal(captureLine(input).replace(/\u00a0/g, ' '), expected));
}

test('numbers stay joined to their units', () => {
  assert.equal(captureLine({ exposure: { seconds: 13, iso: 2500, focal_mm: 14 } }), '13\u00a0s · ISO\u00a02500 · 14\u00a0mm');
});

const shutter = (seconds) => formatShutter(seconds)?.replace(/\u00a0/g, ' ') ?? null;
test('shutter speeds', () => {
  assert.equal(shutter(30), '30 s');
  assert.equal(shutter(2.5), '2.5 s');
  assert.equal(shutter(0.00625), '1/160 s');
  assert.equal(shutter(0), null);
});

test('sky order: newest night first, then slug order within a night', () => {
  const entry = (id, date) => ({ id, data: { date: new Date(date) } });
  const shuffled = [entry('2026-06-13-jabal-al-sarah-0159', '2026-06-13'), entry('2026-05-02-wadi', '2026-05-02'),
    entry('2026-06-13-jabal-al-sarah', '2026-06-13'), entry('2026-06-13-jabal-al-sarah-0030', '2026-06-13')];
  assert.deepEqual(shuffled.sort(newestFirst).map(({ id }) => id),
    ['2026-06-13-jabal-al-sarah', '2026-06-13-jabal-al-sarah-0030', '2026-06-13-jabal-al-sarah-0159', '2026-05-02-wadi']);
});
