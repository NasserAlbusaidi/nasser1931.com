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
title: "The Silent Creep"
subtitle: "How a +387 kcal/day drift erased a 67%-efficient training block."
byline: "Nasser Al Busaidi · Muscat · April 2026"
description: "1,300 days of training, eating, and weight data, walked through six guardrails. Headline: training works at 67% efficiency, but baseline intake quietly drifted +387 kcal/day across four phases."
eyebrow: "field report"
ogType: "article"
image: "/paper/figures/fig1_hero_landscape.png"
---

`;

const V1_FRONTMATTER = `---
layout: ../../layouts/Paper.astro
title: "Becoming a Cyclist on Camera — data-doc"
subtitle: "Data-doc: receipts, appendices, retracted findings, and the audits that caught them."
byline: "Nasser Al Busaidi — Muscat, Oman — drafted April 2026"
description: "Full receipts version of the field report. Per-section reproduction scripts, data dictionary, retracted findings, and the audits that caught them."
eyebrow: "data-doc / receipts"
ogType: "article"
image: "/paper/figures/fig01_longitudinal_multipanel.png"
share: false
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
	// The Paper layout already renders title/subtitle/byline from frontmatter.
	// Drop everything before the first `## ` section heading so the head
	// (title, italic subtitle, byline, leading horizontal rule) doesn't
	// double-print regardless of which source paper we're syncing.
	const idx = markdown.search(/^##\s/m);
	return idx > 0 ? markdown.slice(idx) : markdown;
}

// v2 uses standalone markdown images: ![Figure N. caption](/paper/figures/figXX.png)
// These render as <p><img></p>, which the breakout CSS (figure { margin-left: 50% ... })
// does not target — so figures stay column-width. Convert each standalone-paragraph
// image into a <figure>/<figcaption> block so the breakout layout applies and the
// caption renders alongside the image.
// Match standalone-paragraph markdown images for figures. Allows either
// `Figure N.` or `Figure N —` separators and any png filename under
// /paper/figures/ (newer paper uses fig1_*, test1_*, etc.).
const V2_FIGURE_RE = /^!\[Figure (\d+)\s*[.—–-]\s*([\s\S]+?)\]\((\/paper\/figures\/[A-Za-z0-9_]+\.png)\)\s*$/;
// Italic-line caption duplicate that follows each figure in the new paper:
// `*Figure N — caption.*` — strip these once the <figure> block is in place.
const V2_FIGURE_CAPTION_DUPE_RE = /^\*Figure \d+\s*[.—–-][\s\S]+?\*\s*$/;

function mdItalicsToEm(text) {
	// *foo* -> <em>foo</em>, ignoring ** (bold) and unmatched single asterisks.
	return text.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
}

function escapeAttr(text) {
	return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/\*/g, '');
}

function convertMarkdownImagesToFigures(markdown) {
	const paragraphs = markdown.split(/\n\n+/);
	const out = [];
	for (let i = 0; i < paragraphs.length; i++) {
		const para = paragraphs[i];
		const match = para.trim().match(V2_FIGURE_RE);
		if (!match) {
			out.push(para);
			continue;
		}
		const [, num, caption, src] = match;
		const altText = `Figure ${num}. ${caption}`.replace(/\s+/g, ' ');
		out.push(
			`<figure>\n  <img src="${src}" alt="${escapeAttr(altText)}" loading="lazy" />\n  <figcaption><strong>Figure ${num}.</strong> ${mdItalicsToEm(caption)}</figcaption>\n</figure>`,
		);
		// Skip the next paragraph if it's the duplicate italic caption line.
		const next = paragraphs[i + 1];
		if (next && V2_FIGURE_CAPTION_DUPE_RE.test(next.trim())) i++;
	}
	return out.join('\n\n');
}

// Replace `protocol.json` (the internal phase-config filename) with a more
// readable term for the published paper. Order matters: more specific patterns
// run first so they don't get clobbered by the catch-all replacement.
function renameProtocolJson(markdown) {
	return markdown
		.replace(/`protocol\.json\.phases`/g, 'the phase manifest')
		.replace(/`protocol\.json` phase boundaries/g, 'the phase manifest')
		.replace(/`protocol\.json`/g, 'the phase manifest')
		.replace(/\bprotocol\.json\b/g, 'phase manifest');
}

// Rewrite the internal source-file names (`study-v1.md`, `study-v2.md`) to the
// reader-facing labels. The on-disk artifacts get a clean public name without
// the .md extension as well — see syncV1Raw().
function renameSourceFiles(markdown) {
	return markdown
		.replace(/`study-v1\.md`/g, 'the data-doc')
		.replace(/`study-v2\.md`/g, 'the field report')
		.replace(/\bstudy-v1\.md\b/g, 'the data-doc')
		.replace(/\bstudy-v2\.md\b/g, 'the field report');
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
	const src = join(SOURCE, 'endurance-license/study.md');
	if (!existsSync(src)) {
		console.warn(`[sync-paper] endurance-license/study.md not found at ${src} — skipping /paper sync`);
		return false;
	}
	const body = convertMarkdownImagesToFigures(
		stripV2DuplicateHead(renameSourceFiles(renameProtocolJson(absolutizeFigurePaths(await readFile(src, 'utf8'))))),
	);
	const dest = join(PAGES_PAPER, 'index.md');
	const updated = await writeIfChanged(dest, V2_FRONTMATTER + body);
	console.log(`[sync-paper] endurance-license/study.md -> src/pages/paper/index.md: ${updated ? 'updated' : 'unchanged'}`);
	return updated;
}

async function syncV1Page() {
	const src = join(SOURCE, 'study-v1.md');
	if (!existsSync(src)) {
		console.warn(`[sync-paper] study-v1.md not found at ${src} — skipping /paper/v1 sync`);
		return false;
	}
	const body = stripLeadingH1(renameSourceFiles(renameProtocolJson(absolutizeFigurePaths(await readFile(src, 'utf8')))));
	const transformed = embedFigures(body);
	const dest = join(PAGES_PAPER, 'v1.md');
	const updated = await writeIfChanged(dest, V1_FRONTMATTER + transformed);
	console.log(`[sync-paper] study-v1.md -> src/pages/paper/v1.md: ${updated ? 'updated' : 'unchanged'}`);
	return updated;
}

async function syncV1Raw() {
	const src = join(SOURCE, 'study-v1.md');
	if (!existsSync(src)) return false;
	const body = renameSourceFiles(renameProtocolJson(await readFile(src, 'utf8')));
	const dest = join(PUBLIC_PAPER, 'data-doc');
	const updated = await writeIfChanged(dest, body);
	console.log(`[sync-paper] study-v1.md -> public/paper/data-doc: ${updated ? 'updated' : 'unchanged'}`);
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
	const oldFigs = await syncFigures(join(SOURCE, 'figures'), PUBLIC_FIGURES);
	console.log(`[sync-paper] figures (legacy): ${oldFigs.copied}/${oldFigs.total} updated`);
	const newFigs = await syncFigures(join(SOURCE, 'endurance-license/figures'), PUBLIC_FIGURES);
	console.log(`[sync-paper] figures (endurance-license): ${newFigs.copied}/${newFigs.total} updated`);
}

main().catch((err) => {
	console.error(`[sync-paper] ${err.message}`);
	process.exit(1);
});
