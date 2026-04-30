#!/usr/bin/env node
// Reads a checkout of project-furnace and writes src/data/paper-log.json
// with last-edit timestamp, 7-day commit count, and the 8 most recent
// commits that touched paper/**. Idempotent — only writes on change.
//
// Usage:
//   PAPER_REPO=/path/to/project-furnace node scripts/refresh-paper-log.mjs
// Default PAPER_REPO: ~/Desktop/Personal/ProjecrFurnance

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';

const REPO = resolve(process.env.PAPER_REPO || `${homedir()}/Desktop/Personal/ProjecrFurnance`);
const OUT = resolve('src/data/paper-log.json');
const PATH_FILTER = 'paper/';
const RECENT_LIMIT = 8;
const MESSAGE_CAP = 80;

const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });

const truncate = (s) => {
	const trimmed = s.trim();
	return trimmed.length <= MESSAGE_CAP ? trimmed : trimmed.slice(0, MESSAGE_CAP - 1) + '…';
};

const main = () => {
	// Pull latest if this is a writable working copy. CI uses a fresh
	// checkout so this is a no-op on first run; locally it keeps things fresh.
	try {
		git('fetch', '--quiet', 'origin');
	} catch {
		// not all checkouts have a remote; ignore.
	}

	const raw = git('log', `--pretty=format:%h|%aI|%s`, '-n', '200', '--', PATH_FILTER);
	const lines = raw.split('\n').filter(Boolean);

	const all = lines.map((line) => {
		const idx1 = line.indexOf('|');
		const idx2 = line.indexOf('|', idx1 + 1);
		return {
			sha: line.slice(0, idx1),
			date: line.slice(idx1 + 1, idx2),
			message: line.slice(idx2 + 1)
		};
	});

	const last_edit = all[0]?.date ?? null;
	const since = Date.now() - 7 * 24 * 3600 * 1000;
	const commits_7d = all.filter((c) => {
		const t = new Date(c.date).getTime();
		return !Number.isNaN(t) && t >= since;
	}).length;

	const recent = all.slice(0, RECENT_LIMIT).map((c) => ({
		sha: c.sha,
		date: c.date,
		message: truncate(c.message)
	}));

	const snapshot = {
		updated: new Date().toISOString(),
		last_edit,
		commits_7d,
		commits_total: all.length,
		recent
	};

	mkdirSync(dirname(OUT), { recursive: true });

	const contentKey = (s) => JSON.stringify({ ...s, updated: undefined });
	let prev = null;
	try {
		prev = JSON.parse(readFileSync(OUT, 'utf8'));
	} catch {
		// first run
	}

	if (prev && contentKey(prev) === contentKey(snapshot)) {
		console.log('No change — skipping write.');
		return;
	}

	writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
	console.log(`Wrote ${OUT}`);
	console.log(`last_edit=${last_edit} · ${commits_7d}/7d · ${recent.length} recent`);
};

main();
