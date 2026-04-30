#!/usr/bin/env node
// Pulls a snapshot of recent training from intervals.icu and writes
// src/data/training.json. Idempotent — only writes when content changes.
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

// Canonical TrainingPeaks bands. User asked for 3-bucket translation.
const formBucket = (tsb) => {
	if (tsb === null || tsb === undefined || Number.isNaN(tsb)) return null;
	if (tsb > 5) return 'fresh';
	if (tsb < -10) return 'fatigued';
	return 'neutral';
};

const main = async () => {
	const after14 = isoDate(daysAgo(14));

	const [activities, wellness] = await Promise.all([
		fetchJSON(`${BASE}/athlete/${ATHLETE_ID}/activities?oldest=${after14}&limit=200`),
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

	const recent = (activities || [])
		.filter((a) => ALLOWED_TYPES.has(a.type))
		.sort((a, b) => (b.start_date_local || '').localeCompare(a.start_date_local || ''))
		.slice(0, 3)
		.map((a) => ({
			date: (a.start_date_local || '').split('T')[0],
			type: TYPE_MAP[a.type] || 'workout',
			name: a.name || 'Session',
			distance_km: a.distance ? Number((a.distance / 1000).toFixed(1)) : null,
			duration_min: a.moving_time ? Math.round(a.moving_time / 60) : null
		}));

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
		form: formBucket(form_tsb),
		form_tsb,
		weekly_hours,
		weekly_tss,
		recent
	};

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
	console.log(`form=${snapshot.form} (TSB ${form_tsb}) · ${weekly_hours}h · TSS ${weekly_tss} · ${recent.length} sessions`);
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
