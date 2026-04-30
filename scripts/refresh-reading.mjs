#!/usr/bin/env node
// Pulls the Reading List from Notion and writes src/data/reading.json.
// Idempotent — only writes when content changes.
//
// Env: NOTION_TOKEN (internal integration token, must have access to the db)
//      NOTION_READING_DB (defaults to the known database id)
//
// To set up:
//   1. notion.so/my-integrations → New internal integration
//   2. Open the Reading List page → ... → Connections → add the integration
//   3. Copy the Internal Integration Token, set as NOTION_TOKEN

import fs from 'node:fs';
import path from 'node:path';

const TOKEN = (process.env.NOTION_TOKEN || '').trim();
const DB_ID = (process.env.NOTION_READING_DB || 'cc065a07385442afacf12561c8d7d425').trim();
const NOTION_VERSION = '2022-06-28';

if (!TOKEN) {
	console.error('Missing NOTION_TOKEN');
	process.exit(1);
}

const HEADERS = {
	Authorization: `Bearer ${TOKEN}`,
	'Notion-Version': NOTION_VERSION,
	'Content-Type': 'application/json'
};

const queryDatabase = async () => {
	const all = [];
	let cursor;
	do {
		const body = {
			page_size: 100,
			sorts: [
				{ property: 'Finished', direction: 'descending' },
				{ property: 'Started', direction: 'descending' }
			]
		};
		if (cursor) body.start_cursor = cursor;
		const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
			method: 'POST',
			headers: HEADERS,
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			const txt = await res.text().catch(() => '');
			throw new Error(`Notion query failed: ${res.status} ${res.statusText}\n${txt.slice(0, 400)}`);
		}
		const data = await res.json();
		all.push(...(data.results || []));
		cursor = data.has_more ? data.next_cursor : null;
	} while (cursor);
	return all;
};

const STAR_TO_RATING = {
	'⭐': 1,
	'⭐⭐': 2,
	'⭐⭐⭐': 3,
	'⭐⭐⭐⭐': 4,
	'⭐⭐⭐⭐⭐': 5
};

const propText = (p) => {
	if (!p) return null;
	const arr = p.title || p.rich_text;
	if (!Array.isArray(arr) || arr.length === 0) return null;
	return arr.map((seg) => seg.plain_text).join('').trim() || null;
};

const propSelect = (p) => p?.select?.name ?? null;
const propMulti = (p) => (p?.multi_select || []).map((opt) => opt.name);
const propDate = (p) => p?.date?.start ?? null;

const mapPage = (page) => {
	const props = page.properties || {};
	const ratingName = propSelect(props.Rating);
	return {
		title: propText(props.Title) || '(untitled)',
		author: propText(props.Author),
		status: propSelect(props.Status),
		rating: ratingName ? STAR_TO_RATING[ratingName] ?? null : null,
		format: propSelect(props.Format),
		genres: propMulti(props.Genre),
		started: propDate(props.Started),
		finished: propDate(props.Finished)
	};
};

const main = async () => {
	const pages = await queryDatabase();
	const books = pages.map(mapPage).filter((b) => b.title);

	const currently_reading = books
		.filter((b) => b.status === 'Reading')
		.sort((a, b) => (b.started || '').localeCompare(a.started || ''));

	const finished = books
		.filter((b) => b.status === 'Finished')
		.sort((a, b) => (b.finished || '').localeCompare(a.finished || ''));

	const want_to_read = books
		.filter((b) => b.status === 'Want to Read')
		.sort((a, b) => (b.started || '').localeCompare(a.started || ''));

	const thisYear = new Date().getUTCFullYear();
	const finished_this_year = finished.filter((b) => b.finished?.startsWith(`${thisYear}`)).length;

	const snapshot = {
		updated: new Date().toISOString(),
		stats: {
			finished_total: finished.length,
			finished_this_year
		},
		currently_reading,
		finished,
		want_to_read
	};

	const out = path.resolve('src/data/reading.json');
	fs.mkdirSync(path.dirname(out), { recursive: true });

	const contentKey = (s) => JSON.stringify({ ...s, updated: undefined });
	let prev = null;
	try {
		prev = JSON.parse(fs.readFileSync(out, 'utf8'));
	} catch {
		// first run
	}

	if (prev && contentKey(prev) === contentKey(snapshot)) {
		console.log('No change — skipping write.');
		return;
	}

	fs.writeFileSync(out, JSON.stringify(snapshot, null, 2) + '\n');
	console.log(`Wrote ${out}`);
	console.log(`reading=${currently_reading.length} · finished=${finished.length} · want=${want_to_read.length} · ${finished_this_year} this year`);
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
