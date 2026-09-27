#!/usr/bin/env node
// Writes the next race on the intervals.icu calendar to src/data/next-race.json.
// Idempotent — only writes when content changes.
//
// Env: INTERVALS_API_KEY, INTERVALS_ATHLETE_ID

import fs from 'node:fs';
import path from 'node:path';

const ATHLETE_ID = (process.env.INTERVALS_ATHLETE_ID || process.env.VITE_INTERVALS_ATHLETE_ID || '').trim();
const API_KEY = (process.env.INTERVALS_API_KEY || process.env.VITE_INTERVALS_API_KEY || '').trim();

if (!ATHLETE_ID || !API_KEY) {
	console.error('Missing INTERVALS_API_KEY or INTERVALS_ATHLETE_ID');
	process.exit(1);
}

const BASE = 'https://intervals.icu/api/v1';
const AUTH = 'Basic ' + Buffer.from(`API_KEY:${API_KEY}`).toString('base64');
const HEADERS = { Authorization: AUTH, 'User-Agent': 'nasser1931.com refresh-next-race/1.0' };

const isoDate = (d) => d.toISOString().split('T')[0];
const daysFromNow = (n) => {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + n);
	return d;
};

const fetchJSON = async (url) => {
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`${res.status} ${res.statusText} for ${url}\n${body.slice(0, 500)}`);
	}
	return res.json();
};

// The earliest RACE_A/B/C event within a year. Only public fields are kept:
// the event description can hold private notes.
const main = async () => {
	const today = isoDate(new Date());
	const inAYear = isoDate(daysFromNow(365));
	const events = await fetchJSON(`${BASE}/athlete/${ATHLETE_ID}/events?oldest=${today}&newest=${inAYear}&category=RACE_A,RACE_B,RACE_C`);
	const next = (events || [])
		.filter((e) => /^RACE_/.test(e.category || '') && (e.start_date_local || '') >= today)
		.sort((a, b) => (a.start_date_local || '').localeCompare(b.start_date_local || ''))[0];
	const race = next
		? {
				date: next.start_date_local.split('T')[0],
				name: next.name || 'Race',
				priority: next.category.replace('RACE_', ''),
				distance_km: next.distance ? Number((next.distance / 1000).toFixed(1)) : null
			}
		: null;

	const racePath = path.resolve('src/data/next-race.json');
	const raceJSON = JSON.stringify({ race }, null, '\t') + '\n';
	let prev = null;
	try {
		prev = fs.readFileSync(racePath, 'utf8');
	} catch {
		// first run
	}
	if (prev === raceJSON) {
		console.log('No change — skipping write.');
		return;
	}
	fs.writeFileSync(racePath, raceJSON);
	console.log(`Next race: ${race ? `${race.name} on ${race.date}` : 'none scheduled'}`);
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
