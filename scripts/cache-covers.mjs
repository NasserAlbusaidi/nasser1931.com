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
		const { dominant } = await sharp(input).stats();
		const hex = (n) => n.toString(16).padStart(2, '0');
		const name = `${crypto.createHash('sha1').update(url).digest('hex').slice(0, 12)}.webp`;
		fs.writeFileSync(path.join(DIR, name), data);
		cache[url] = { path: `/covers/${name}`, width: info.width, height: info.height, color: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` };
		added++;
	} catch (error) {
		failed++;
		console.warn(`Cover failed (${error.message}): ${url}`);
	}
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
