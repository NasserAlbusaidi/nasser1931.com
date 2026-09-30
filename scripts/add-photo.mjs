// Adds a sky photo: a web-size, metadata-free copy plus a content entry.
//
//   npm run add-photo -- <image> --title "…" --location "…" [--exif-from <raw>]
//                        [--stack <n|unknown>] [--alt "…"] [--slug …] [--force]
//
// Originals stay where they are (D:\Camera). Stacked TIFFs usually carry no
// capture data, so --exif-from reads it from one of the source frames.
// The repository is public: the copy is re-encoded without EXIF, so GPS and
// camera serial numbers never reach Git. The script checks that before it writes.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import exifr from 'exifr';
import sharp from 'sharp';

export const MAX_WIDTH = 3000;
const CONTENT_DIR = new URL('../src/content/sky/', import.meta.url);

/** Camera-local "2026:06:13 00:30:40" → "2026-06-13". No time-zone shift. */
export const cameraDate = (raw) => {
  const match = typeof raw === 'string' && raw.match(/^(\d{4})[:-](\d{2})[:-](\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
};

export const slugify = (text) => text.normalize('NFKD').toLowerCase()
  .replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');

export const readCapture = async (file) => {
  const tags = await exifr.parse(file, {
    pick: ['Make', 'Model', 'LensMake', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal'],
    reviveValues: false,
  }).catch(() => null) ?? {};
  const camera = [tags.Make, tags.Model].filter(Boolean).join(' ') || null;
  const lens = [tags.LensMake, tags.LensModel].filter(Boolean).join(' ') || null;
  return {
    date: cameraDate(tags.DateTimeOriginal),
    camera,
    lens,
    exposure: {
      seconds: tags.ExposureTime ?? undefined,
      aperture: tags.FNumber ?? undefined,
      iso: tags.ISO ?? undefined,
      focal_mm: tags.FocalLength ?? undefined,
    },
  };
};

/** Re-encode without metadata. sharp drops EXIF, XMP, and IPTC unless asked to keep them. */
export const exportPhoto = async (input, output, maxWidth = MAX_WIDTH) => {
  // unlimited: Lightroom and Photoshop TIFFs carry a data block over libtiff's 50 MB read limit.
  const info = await sharp(input, { failOn: 'none', limitInputPixels: false, unlimited: true })
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(output);
  const left = await exifr.parse(output, { gps: true, tiff: true, xmp: true, iptc: true }).catch(() => null);
  if (left && Object.keys(left).length) throw new Error(`metadata survived export: ${Object.keys(left).join(', ')}`);
  return info;
};

const yamlValue = (value) => (typeof value === 'string' ? JSON.stringify(value) : String(value));

export const renderEntry = ({ title, date, location, alt, camera, lens, exposure = {}, stack }) => {
  const lines = ['---', `title: ${yamlValue(title)}`, `date: ${date}`, `location: ${yamlValue(location)}`,
    'photo: ./photo.jpg', `alt: ${yamlValue(alt ?? title)}`];
  if (camera) lines.push(`camera: ${yamlValue(camera)}`);
  if (lens) lines.push(`lens: ${yamlValue(lens)}`);
  const fields = Object.entries(exposure).filter(([, value]) => value !== undefined);
  if (fields.length) lines.push('exposure:', ...fields.map(([key, value]) => `  ${key}: ${value}`));
  if (stack !== undefined) lines.push(`stack: ${yamlValue(stack)}`);
  lines.push('---', '');
  return lines.join('\n');
};

export const parseStack = (value) => {
  if (value === undefined) return undefined;
  if (value === 'unknown') return 'unknown';
  const count = Number(value);
  if (!Number.isInteger(count) || count < 2) throw new Error(`--stack must be a whole number above 1, or "unknown" (got ${value})`);
  return count;
};

const main = async () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      title: { type: 'string' }, location: { type: 'string' }, alt: { type: 'string' },
      'exif-from': { type: 'string' }, stack: { type: 'string' }, slug: { type: 'string' }, force: { type: 'boolean' },
    },
  });
  const [input] = positionals;
  if (!input || !values.title || !values.location) {
    throw new Error('usage: npm run add-photo -- <image> --title "…" --location "…" [--exif-from <raw>] [--stack <n|unknown>] [--alt "…"]');
  }
  if (!existsSync(input)) throw new Error(`no such file: ${input}`);
  const capture = await readCapture(values['exif-from'] ?? input);
  if (!capture.date) throw new Error('no capture date in the EXIF; pass --exif-from with a source frame');

  const slug = values.slug ?? `${capture.date}-${slugify(values.location)}`;
  const dir = new URL(`${slug}/`, CONTENT_DIR);
  const existed = existsSync(dir);
  if (existed && !values.force) throw new Error(`${slug} already exists; pass --force to replace it`);
  mkdirSync(dir, { recursive: true });

  const info = await exportPhoto(input, join(fileURLToPath(dir), 'photo.jpg')).catch((error) => {
    if (!existed) rmSync(dir, { recursive: true, force: true });
    throw error;
  });
  const entry = renderEntry({ ...capture, title: values.title, location: values.location, alt: values.alt, stack: parseStack(values.stack) });
  writeFileSync(new URL('index.md', dir), entry);
  console.log(`wrote src/content/sky/${slug}/ (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
  console.log('Check camera and lens names in index.md; the script copies them from the EXIF as written.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exit(1); });
}
