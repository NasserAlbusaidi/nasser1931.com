#!/usr/bin/env node
// Pulls a snapshot of recent training from intervals.icu and writes
// src/data/training.json, plus the next race on the calendar to
// src/data/next-race.json. Idempotent — only writes when content changes.
//
// Env: INTERVALS_API_KEY, INTERVALS_ATHLETE_ID
// Debug: PULSE_DEBUG=1 to dump raw payload shapes.

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
const HEADERS = { Authorization: AUTH, 'User-Agent': 'nasser1931.com refresh-pulse/1.0' };

const isoDate = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - n);
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

const ALLOWED_TYPES = new Set(['Ride', 'Run', 'Swim', 'OpenWaterSwim', 'WeightTraining']);
const TYPE_MAP = {
	Ride: 'bike',
	Run: 'run',
	Swim: 'swim',
	OpenWaterSwim: 'swim',
	WeightTraining: 'workout'
};

// The public pulse shows activity volume, not recovery interpretation.
const main = async () => {
	const after14 = isoDate(daysAgo(14));
	// Activities reach further back than wellness so a gym-heavy stretch
	// can't push the latest ride out of the snapshot.
	const after30 = isoDate(daysAgo(30));

	const [activities, wellness] = await Promise.all([
		fetchJSON(`${BASE}/athlete/${ATHLETE_ID}/activities?oldest=${after30}&limit=200`),
		fetchJSON(`${BASE}/athlete/${ATHLETE_ID}/wellness?oldest=${after14}`)
	]);

	if (process.env.PULSE_DEBUG === '1') {
		console.error('--- WELLNESS (latest 3, all keys) ---');
		const w = (wellness || []).slice().sort((a, b) => (b.id || '').localeCompare(a.id || ''));
		console.error(JSON.stringify(w.slice(0, 3), null, 2));
		console.error('--- ACTIVITY (newest, all keys) ---');
		const a = (activities || []).slice().sort((x, y) => (y.start_date_local || '').localeCompare(x.start_date_local || ''));
		console.error(JSON.stringify(a[0], null, 2));
	}

	const toSession = (a) => ({
		date: (a.start_date_local || '').split('T')[0],
		type: TYPE_MAP[a.type] || 'workout',
		name: a.name || 'Session',
		distance_km: a.distance ? Number((a.distance / 1000).toFixed(1)) : null,
		duration_min: a.moving_time ? Math.round(a.moving_time / 60) : null
	});
	const sessions = (activities || [])
		.filter((a) => ALLOWED_TYPES.has(a.type))
		.sort((a, b) => (b.start_date_local || '').localeCompare(a.start_date_local || ''));
	const recent = sessions.slice(0, 3).map(toSession);
	// Picked from the full window, not from `recent`: three gym sessions in a
	// row would otherwise hide the ride and the site would claim there was none.
	const rideActivity = sessions.find((a) => a.type === 'Ride');
	const last_ride = rideActivity ? toSession(rideActivity) : null;

	const since7 = daysAgo(7).getTime();
	const last7 = (activities || []).filter((a) => {
		if (!ALLOWED_TYPES.has(a.type)) return false;
		const t = new Date(a.start_date_local).getTime();
		return t >= since7;
	});
	const weekly_seconds = last7.reduce((s, a) => s + (a.moving_time || 0), 0);
	const weekly_hours = Number((weekly_seconds / 3600).toFixed(1));
	const weekly_tss = Math.round(last7.reduce((s, a) => s + (a.icu_training_load || 0), 0));

	// Form: prefer explicit `form` field, else compute from CTL - ATL.
	const sortedWellness = (wellness || []).slice().sort((a, b) => (b.id || '').localeCompare(a.id || ''));
	let form_tsb = null;
	for (const w of sortedWellness) {
		const computed = w.ctl != null && w.atl != null ? Number((w.ctl - w.atl).toFixed(1)) : null;
		const explicit = typeof w.form === 'number' ? Number(w.form.toFixed(1)) : null;
		const tsb = explicit ?? computed;
		if (tsb !== null && !Number.isNaN(tsb)) {
			form_tsb = tsb;
			break;
		}
	}

	const snapshot = {
		updated: new Date().toISOString(),
		form_tsb,
		weekly_hours,
		weekly_tss,
		recent,
		last_ride
	};

	// Next race: the earliest RACE_A/B/C event within a year. Only public fields
	// are kept (no event description, which can hold private notes). A failed
	// lookup leaves the previous file alone rather than failing the pulse.
	try {
		const today = isoDate(new Date());
		const inAYear = isoDate(daysAgo(-365));
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
		let prevRace = null;
		try {
			prevRace = fs.readFileSync(racePath, 'utf8');
		} catch {
			// first run
		}
		if (prevRace !== raceJSON) {
			fs.writeFileSync(racePath, raceJSON);
			console.log(`Next race: ${race ? `${race.name} on ${race.date}` : 'none scheduled'}`);
		}
	} catch (error) {
		console.warn(`Next-race lookup failed; keeping the previous file. ${error.message}`);
	}

	const outPath = path.resolve('src/data/training.json');
	fs.mkdirSync(path.dirname(outPath), { recursive: true });

	const contentKey = (s) => JSON.stringify({ ...s, updated: undefined });
	let prev = null;
	try {
		prev = JSON.parse(fs.readFileSync(outPath, 'utf8'));
	} catch {
		// first run
	}

	if (prev && contentKey(prev) === contentKey(snapshot)) {
		console.log('No change — skipping write.');
		return;
	}

	fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n');
	console.log(`Wrote ${outPath}`);
	console.log(`${weekly_hours}h · TSS ${weekly_tss} · ${recent.length} sessions`);
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
