#!/usr/bin/env node
// Downloads every book cover the site references (the curated manifest in
// src/data/book-covers.json plus Hardcover cover_url fields in reading.json),
// stores a 400px WebP copy in public/covers/, and records it in
// src/data/cover-cache.json with dimensions and a dominant colour for the
// shelf spines. Covers then load from our own domain instead of hot-linking.
//
// Idempotent: existing entries are kept; failures are logged and left for the
// next run, and the page falls back to the remote URL or a styled title block.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const MANIFEST = path.resolve('src/data/book-covers.json');
const READING = path.resolve('src/data/reading.json');
const CACHE = path.resolve('src/data/cover-cache.json');
const DIR = path.resolve('public/covers');

const readJSON = (file, fallback) => {
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'));
	} catch (error) {
		if (error.code === 'ENOENT') return fallback;
		throw error;
	}
};

const reading = readJSON(READING, {});
const urls = new Set(readJSON(MANIFEST, []).map((cover) => cover.sourceUrl));
for (const list of ['currently_reading', 'finished', 'want_to_read', 'dropped']) {
	for (const book of reading[list] ?? []) if (book.cover_url) urls.add(book.cover_url);
}

const cache = readJSON(CACHE, {});

// Spine colour: the most saturated colour that covers a real share of the
// cover, not the most common one (usually a black or white background).
// Greyscale covers fall back to their average, kept off pure black/white so
// the spine still reads against either theme's page.
const hex = (n) => Math.round(n).toString(16).padStart(2, '0');
const spineColor = async (input) => {
	const { data, info } = await sharp(input).resize(32, 48, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	const buckets = new Map();
	let sum = [0, 0, 0];
	const pixels = info.width * info.height;
	for (let i = 0; i < data.length; i += 3) {
		const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
		sum = [sum[0] + r, sum[1] + g, sum[2] + b];
		const max = Math.max(r, g, b) / 255;
		const min = Math.min(r, g, b) / 255;
		const light = (max + min) / 2;
		const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * light - 1));
		if (light < 0.14 || light > 0.9 || sat < 0.3) continue;
		const key = `${r >> 5},${g >> 5},${b >> 5}`;
		const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0, sat: 0 };
		bucket.count++; bucket.r += r; bucket.g += g; bucket.b += b; bucket.sat += sat;
		buckets.set(key, bucket);
	}
	let best = null;
	for (const bucket of buckets.values()) {
		if (bucket.count < pixels * 0.03) continue;
		const score = bucket.count * (0.4 + bucket.sat / bucket.count);
		if (!best || score > best.score) best = { ...bucket, score };
	}
	let [r, g, b] = best ? [best.r / best.count, best.g / best.count, best.b / best.count] : sum.map((v) => v / pixels);
	// Clamp lightness so near-black and near-white spines keep an edge.
	const light = (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
	const target = Math.min(0.8, Math.max(0.2, light));
	if (light !== target) {
		const mix = light < target ? [255, (target - light) / (1 - light)] : [0, (light - target) / light];
		[r, g, b] = [r, g, b].map((c) => c + (mix[0] - c) * mix[1]);
	}
	return `#${hex(r)}${hex(g)}${hex(b)}`;
};
fs.mkdirSync(DIR, { recursive: true });

let added = 0;
let failed = 0;
for (const url of urls) {
	const known = cache[url];
	if (known && fs.existsSync(path.join('public', known.path))) continue;
	try {
		const res = await fetch(url, { headers: { 'user-agent': 'nasser1931.com cover cache' }, redirect: 'follow' });
		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
		const input = Buffer.from(await res.arrayBuffer());
		const image = sharp(input).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 78 });
		const { data, info } = await image.toBuffer({ resolveWithObject: true });
		if (info.width < 40 || info.height < 60) throw new Error(`implausible cover ${info.width}x${info.height}`);
		const name = `${crypto.createHash('sha1').update(url).digest('hex').slice(0, 12)}.webp`;
		fs.writeFileSync(path.join(DIR, name), data);
		cache[url] = { path: `/covers/${name}`, width: info.width, height: info.height, color: await spineColor(input) };
		added++;
	} catch (error) {
		failed++;
		console.warn(`Cover failed (${error.message}): ${url}`);
	}
}

// Recolour cached covers from their local files so a change to spineColor
// applies without downloading anything again.
for (const entry of Object.values(cache)) {
	const file = path.join('public', entry.path);
	if (fs.existsSync(file)) entry.color = await spineColor(fs.readFileSync(file));
}

// Drop entries for covers the site no longer references.
for (const url of Object.keys(cache)) {
	if (!urls.has(url)) {
		fs.rmSync(path.join('public', cache[url].path), { force: true });
		delete cache[url];
	}
}

const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(CACHE, JSON.stringify(sorted, null, 2) + '\n');
console.log(`Covers: ${added} added, ${failed} failed, ${Object.keys(sorted).length} cached.`);
