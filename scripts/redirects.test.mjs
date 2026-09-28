// Retired routes must land on a live page in one hop. Firebase evaluates
// redirects in order and supports `*` (one segment) and `**` (any depth) globs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const { redirects } = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url), 'utf8')).hosting;

const toRegExp = (glob) => new RegExp('^' + glob
	.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
	.replace(/\*\*/g, '\u0000')
	.replace(/\*/g, '[^/]*')
	.replace(/\u0000/g, '.*') + '$');
const resolve = (path) => redirects.find(rule => toRegExp(rule.source).test(path)) ?? null;
const pageFor = (route) => new URL(`../src/pages${route}/index.astro`, import.meta.url);

const cases = [
	['/field', '/races'],
	['/field/2026-04-26-launch-of-this-page', '/races'],
	['/coach', '/races'],
	['/coach/anything/deep', '/races'],
	['/paper', '/builds'],
	['/paper/figures/fig1_hero_landscape.png', '/builds'],
];

for (const [from, to] of cases) {
	test(`${from} → ${to}`, () => {
		const rule = resolve(from);
		assert.ok(rule, `no redirect matches ${from}`);
		assert.equal(rule.destination, to);
		assert.equal(rule.type, 301);
		assert.equal(resolve(to), null, `${to} redirects again`);
		assert.ok(existsSync(pageFor(to)), `${to} has no page`);
	});
}

for (const route of ['/races', '/builds', '/reading', '/stupidshit']) {
	test(`${route} is served, not redirected`, () => {
		assert.equal(resolve(route), null);
	});
}

for (const retired of ['/field', '/paper', '/coach']) {
	test(`${retired} has no page left behind`, () => {
		assert.ok(!existsSync(new URL(`../src/pages${retired}`, import.meta.url)));
	});
}

// Firebase 301s /builds/ to /builds. Canonical, sitemap, and RSS URLs come from
// Astro, so Astro must drop the slash too, or every one of them is a redirect.
test('Astro URLs match Firebase trailing-slash handling', async () => {
	const { trailingSlash } = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url), 'utf8')).hosting;
	assert.equal(trailingSlash, false);
	const astroConfig = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
	assert.match(astroConfig, /trailingSlash:\s*'never'/);
	const rss = readFileSync(new URL('../src/pages/rss.xml.js', import.meta.url), 'utf8');
	assert.match(rss, /trailingSlash:\s*false/);
	assert.doesNotMatch(rss, /link: `[^`]*\/`/);
});
