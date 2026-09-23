#!/usr/bin/env node
// Pulls the reading shelf from Hardcover (hardcover.app) and writes
// src/data/reading.json in the same shape the StoryGraph importer produces,
// plus live reading progress for books in progress.
//
// Env: HARDCOVER_TOKEN      API token from hardcover.app/account/api
//                           (with or without the leading "Bearer ")
//      HARDCOVER_TAKEOVER=1 required once to replace a snapshot that another
//                           source (StoryGraph, Notion) currently owns
//
// Safety: skips without a token, refuses to replace another source's snapshot
// unless HARDCOVER_TAKEOVER=1, and never writes an empty library.

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('src/data/reading.json');
const ENDPOINT = 'https://api.hardcover.app/v1/graphql';

let existing = null;
try {
	existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}

const takeover = process.env.HARDCOVER_TAKEOVER === '1';
if (existing?.source && existing.source !== 'hardcover' && !takeover) {
	console.log(`Reading source is ${existing.source}; set HARDCOVER_TAKEOVER=1 to switch to Hardcover. Skipping.`);
	process.exit(0);
}

const rawToken = (process.env.HARDCOVER_TOKEN || '').trim();
if (!rawToken) {
	console.log('HARDCOVER_TOKEN not set; skipping Hardcover sync.');
	process.exit(0);
}
const TOKEN = rawToken.replace(/^Bearer\s+/i, '');

// Hardcover status ids: 1 Want to Read, 2 Currently Reading, 3 Read, 5 Did Not Finish.
const STATUS = { 1: 'Want to Read', 2: 'Reading', 3: 'Finished', 5: 'Dropped' };

const QUERY = `
query Shelf {
  me {
    username
    user_books(where: { status_id: { _in: [1, 2, 3, 5] } }, order_by: { updated_at: desc }) {
      status_id
      rating
      date_added
      last_read_date
      book {
        title
        pages
        image { url }
        contributions(limit: 3) { contribution author { name } }
      }
      edition { pages reading_format { format } image { url } }
      user_book_reads(order_by: { started_at: desc_nulls_last }, limit: 1) {
        started_at
        finished_at
        progress
        progress_pages
      }
    }
  }
}`;

const res = await fetch(ENDPOINT, {
	method: 'POST',
	headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json', 'user-agent': 'nasser1931.com reading sync' },
	body: JSON.stringify({ query: QUERY })
});
if (!res.ok) throw new Error(`Hardcover ${res.status} ${res.statusText}: ${(await res.text()).slice(0, 500)}`);
const payload = await res.json();
if (payload.errors?.length) throw new Error(`Hardcover GraphQL: ${JSON.stringify(payload.errors).slice(0, 800)}`);

const me = Array.isArray(payload.data?.me) ? payload.data.me[0] : payload.data?.me;
if (!me) throw new Error('Hardcover returned no user for this token.');

const day = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null);
const authorOf = (book) => {
	const people = (book?.contributions ?? []).filter((c) => !c.contribution || /author/i.test(c.contribution));
	return people[0]?.author?.name ?? book?.contributions?.[0]?.author?.name ?? null;
};
// reading_formats.format is Read, Listened, Both, or Ebook.
const formatOf = (edition) => {
	const format = edition?.reading_format?.format;
	if (typeof format !== 'string') return null;
	return /listen/i.test(format) ? 'Audiobook' : /ebook/i.test(format) ? 'Ebook' : /read/i.test(format) ? 'Physical' : null;
};

const books = (me.user_books ?? [])
	.filter((entry) => entry.book?.title && STATUS[entry.status_id])
	.map((entry) => {
		const read = entry.user_book_reads?.[0] ?? {};
		const pages = entry.edition?.pages ?? entry.book.pages ?? null;
		const status = STATUS[entry.status_id];
		let progress = null;
		if (status === 'Reading') {
			if (typeof read.progress === 'number') progress = Math.round(read.progress);
			else if (pages && typeof read.progress_pages === 'number') progress = Math.round((read.progress_pages / pages) * 100);
			if (progress !== null) progress = Math.min(100, Math.max(0, progress));
		}
		return {
			title: entry.book.title.trim(),
			author: authorOf(entry.book),
			status,
			rating: typeof entry.rating === 'number' ? entry.rating : null,
			format: formatOf(entry.edition),
			genres: [],
			started: day(read.started_at),
			finished: status === 'Finished' ? day(read.finished_at) ?? day(entry.last_read_date) : null,
			progress,
			pages,
			cover_url: entry.edition?.image?.url ?? entry.book.image?.url ?? null
		};
	});

if (!books.length) {
	console.error('Hardcover returned an empty library; refusing to overwrite the shelf.');
	process.exit(1);
}

const byDateDesc = (field) => (a, b) => (b[field] ?? '').localeCompare(a[field] ?? '') || a.title.localeCompare(b.title);
const finished = books.filter((b) => b.status === 'Finished').sort(byDateDesc('finished'));
const updated = new Date().toISOString();
const snapshot = {
	source: 'hardcover',
	source_method: 'api',
	profile_url: me.username ? `https://hardcover.app/@${me.username}` : null,
	updated,
	stats: {
		finished_total: finished.length,
		finished_this_year: finished.filter((b) => b.finished?.slice(0, 4) === updated.slice(0, 4)).length
	},
	currently_reading: books.filter((b) => b.status === 'Reading').sort(byDateDesc('started')),
	finished,
	want_to_read: books.filter((b) => b.status === 'Want to Read').sort((a, b) => a.title.localeCompare(b.title)),
	dropped: books.filter((b) => b.status === 'Dropped').sort((a, b) => a.title.localeCompare(b.title))
};

const contentKey = (s) => JSON.stringify({ ...s, updated: undefined });
if (existing && contentKey(existing) === contentKey(snapshot)) {
	console.log('No change; skipping write.');
	process.exit(0);
}
fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote ${OUT}: ${snapshot.currently_reading.length} reading, ${finished.length} finished, ${snapshot.want_to_read.length} to read.`);
