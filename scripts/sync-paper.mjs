#!/usr/bin/env node
// Sync the paper from ProjecrFurnance into the site.
//
// Targets:
//   - study-v2.md  ->  src/pages/paper/index.md   (canonical /paper, frontmatter prepended)
//   - study-v1.md  ->  src/pages/paper/v1.md      (/paper/v1, figures auto-embedded)
//   - study-v1.md  ->  public/paper/study-v1.md   (raw download, served as-is)
//   - figures/*    ->  public/paper/figures/*
//
// Override the source dir with PAPER_SOURCE env var.

import { mkdir, copyFile, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const SOURCE = process.env.PAPER_SOURCE
	? resolve(process.env.PAPER_SOURCE)
	: join(homedir(), 'Desktop/Personal/ProjecrFurnance/paper');

const PUBLIC_PAPER = join(REPO_ROOT, 'public/paper');
const PUBLIC_FIGURES = join(PUBLIC_PAPER, 'figures');
const PAGES_PAPER = join(REPO_ROOT, 'src/pages/paper');

const V2_FRONTMATTER = `---
layout: ../../layouts/Paper.astro
title: "Becoming a Cyclist on Camera"
subtitle: "Field report from a four-year self-experiment, written for a reader."
byline: "Nasser Al Busaidi — Muscat, Oman — drafted April 2026"
description: "Four years of daily body composition, sleep, HRV, and cycling performance data, audited against a six-check guardrail. Three findings survived. Two were retracted on the page."
eyebrow: "field report"
companion:
  href: "/paper/v1"
  label: "see the receipts → /paper/v1"
---

`;

const V1_FRONTMATTER = `---
layout: ../../layouts/Paper.astro
title: "Becoming a Cyclist on Camera — v1"
subtitle: "Data-doc: receipts, appendices, retracted findings, and the audits that caught them."
byline: "Nasser Al Busaidi — Muscat, Oman — drafted April 2026"
description: "Full receipts version of the field report. Per-section reproduction scripts, data dictionary, retracted findings, and the audits that caught them."
eyebrow: "data-doc / receipts"
companion:
  href: "/paper"
  label: "← back to the readable cut"
---

`;

const FIGURE_REF_RE = /\*\*Figure (\d+)\*\* \(`paper\/figures\/(fig[0-9_a-z]+\.png)`\)/;

// Append a <figure> block after each paragraph that mentions a figure.
// v1 uses inline references like: **Figure 3** (`paper/figures/fig06_strength_regression.png`).
// We inject the actual image directly below that paragraph so a web reader
// sees the figure alongside the prose.
function embedFigures(markdown) {
	const paragraphs = markdown.split(/\n\n+/);
	const out = [];
	for (const para of paragraphs) {
		out.push(para);
		const match = para.match(FIGURE_REF_RE);
		if (match) {
			const num = match[1];
			const file = match[2];
			out.push(
				`<figure>\n  <img src="/paper/figures/${file}" alt="Figure ${num}" loading="lazy" />\n  <figcaption><strong>Figure ${num}.</strong> See paragraph above for full caption; the image is produced by <code>paper/scripts/build_figures.py</code>.</figcaption>\n</figure>`,
			);
		}
	}
	return out.join('\n\n');
}

async function ensureDir(dir) {
	await mkdir(dir, { recursive: true });
}

async function copyIfChanged(src, dest) {
	if (!existsSync(src)) {
		throw new Error(`source missing: ${src}`);
	}
	await ensureDir(dirname(dest));

	const srcStat = await stat(src);
	if (existsSync(dest)) {
		const destStat = await stat(dest);
		if (srcStat.size === destStat.size && srcStat.mtimeMs <= destStat.mtimeMs) {
			return false;
		}
	}
	await copyFile(src, dest);
	return true;
}

async function writeIfChanged(dest, contents) {
	await ensureDir(dirname(dest));
	if (existsSync(dest)) {
		const current = await readFile(dest, 'utf8');
		if (current === contents) return false;
	}
	await writeFile(dest, contents, 'utf8');
	return true;
}

async function syncFigures(srcDir, destDir) {
	if (!existsSync(srcDir)) {
		throw new Error(`figures source missing: ${srcDir}`);
	}
	await ensureDir(destDir);
	const entries = await readdir(srcDir);
	const pngs = entries.filter((f) => f.endsWith('.png'));
	let copied = 0;
	for (const name of pngs) {
		if (await copyIfChanged(join(srcDir, name), join(destDir, name))) copied++;
	}
	return { total: pngs.length, copied };
}

// The Paper layout already renders title/subtitle/byline from frontmatter.
// Source markdown re-prints them at the top — strip the duplicates so the
// rendered page doesn't show the title twice.
function stripLeadingH1(markdown) {
	return markdown.replace(/^#\s+[^\n]+\n+/, '');
}

function stripV2DuplicateHead(markdown) {
	// v2 starts with: # Title \n\n ### Subtitle \n\n *Byline* \n\n
	// All three mirror the frontmatter exactly — strip them.
	let out = stripLeadingH1(markdown);
	out = out.replace(/^###\s+[^\n]+\n+/, '');
	out = out.replace(/^\*[^\n*][^\n]*\*\n+/, '');
	return out;
}

// Rewrite relative figure paths to absolute /paper/figures/... so Astro/Vite
// resolves them to public/ instead of trying to import them as modules.
function absolutizeFigurePaths(markdown) {
	return markdown
		// markdown image syntax: ![alt](figures/figXX.png) -> ![alt](/paper/figures/figXX.png)
		.replace(/(!\[[^\]]*\]\()figures\//g, '$1/paper/figures/')
		// HTML img src: src="figures/figXX.png" -> src="/paper/figures/figXX.png"
		.replace(/(src=["'])figures\//g, '$1/paper/figures/');
}

async function syncV2() {
	const src = join(SOURCE, 'study-v2.md');
	if (!existsSync(src)) {
		console.warn(`[sync-paper] study-v2.md not found at ${src} — skipping /paper sync`);
		return false;
	}
	const body = stripV2DuplicateHead(absolutizeFigurePaths(await readFile(src, 'utf8')));
	const dest = join(PAGES_PAPER, 'index.md');
	const updated = await writeIfChanged(dest, V2_FRONTMATTER + body);
	console.log(`[sync-paper] study-v2.md -> src/pages/paper/index.md: ${updated ? 'updated' : 'unchanged'}`);
	return updated;
}

async function syncV1Page() {
	const src = join(SOURCE, 'study-v1.md');
	if (!existsSync(src)) {
		console.warn(`[sync-paper] study-v1.md not found at ${src} — skipping /paper/v1 sync`);
		return false;
	}
	const body = stripLeadingH1(await readFile(src, 'utf8'));
	const transformed = embedFigures(body);
	const dest = join(PAGES_PAPER, 'v1.md');
	const updated = await writeIfChanged(dest, V1_FRONTMATTER + transformed);
	console.log(`[sync-paper] study-v1.md -> src/pages/paper/v1.md: ${updated ? 'updated' : 'unchanged'}`);
	return updated;
}

async function syncV1Raw() {
	const updated = await copyIfChanged(
		join(SOURCE, 'study-v1.md'),
		join(PUBLIC_PAPER, 'study-v1.md'),
	);
	console.log(`[sync-paper] study-v1.md -> public/paper/study-v1.md: ${updated ? 'updated' : 'unchanged'}`);
	return updated;
}

async function main() {
	if (!existsSync(SOURCE)) {
		console.error(`[sync-paper] source dir not found: ${SOURCE}`);
		console.error(`[sync-paper] set PAPER_SOURCE env var to override`);
		process.exit(1);
	}

	console.log(`[sync-paper] source: ${SOURCE}`);

	await syncV2();
	await syncV1Page();
	await syncV1Raw();
	const figs = await syncFigures(join(SOURCE, 'figures'), PUBLIC_FIGURES);
	console.log(`[sync-paper] figures: ${figs.copied}/${figs.total} updated`);
}

main().catch((err) => {
	console.error(`[sync-paper] ${err.message}`);
	process.exit(1);
});
