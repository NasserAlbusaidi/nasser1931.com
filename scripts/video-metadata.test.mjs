import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { locationMarkers } from './video-metadata.mjs';

const box = (type, ...children) => {
  const payload = Buffer.concat(children.map((child) => (typeof child === 'string' ? Buffer.from(child, 'latin1') : child)));
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + payload.length);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, payload]);
};
const ftyp = box('ftyp', 'isom\0\0\x02\0');

// The repository is public, so no committed video may say where it was made.
const cases = [
  ['clean file', [ftyp, box('moov', box('udta', box('©too', 'Lavf'))), box('mdat', 'frames')], []],
  ['QuickTime location', [ftyp, box('moov', box('udta', box('©xyz', '+23.0+057.5/')))], ['©xyz']],
  ['3GPP location', [ftyp, box('moov', box('udta', box('loci', 'place')))], ['loci']],
  ['XMP packet', [ftyp, box('uuid', '<x:xmpmeta xmlns:x="adobe:ns:meta/">')], ['<x:xmpmeta']],
  ['marker bytes inside media data', [ftyp, box('moov'), box('mdat', 'xx loci xx')], []],
];

for (const [label, boxes, expected] of cases) {
  test(`video metadata: ${label}`, () => assert.deepEqual(locationMarkers(Buffer.concat(boxes)), expected));
}

test('video metadata: a broken box size throws', () => {
  assert.throws(() => locationMarkers(Buffer.concat([ftyp, Buffer.from([0, 0, 0, 99, 0x6d, 0x6f, 0x6f, 0x76])])));
});

const skyDir = new URL('../src/content/sky/', import.meta.url);
const videos = readdirSync(skyDir, { recursive: true }).filter((file) => String(file).endsWith('.mp4'));
for (const file of videos) {
  test(`committed timelapse has no location metadata: ${file}`, () => {
    assert.deepEqual(locationMarkers(readFileSync(new URL(String(file).replaceAll('\\', '/'), skyDir))), []);
  });
}
