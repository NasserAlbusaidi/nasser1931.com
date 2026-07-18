#!/usr/bin/env node
// One-shot generator for the site's OG fallback image.
// Splits v1.0 palette + typography (see DESIGN.md). Re-run when the look changes.
//
// Text is rendered as glyph paths via fontkit — sharp's librsvg rasterizer
// ignores @font-face webfonts, so <text> in a brand font silently falls back
// to a system face. Paths make the output identical on any machine.
//
// Output: src/assets/og-fallback.jpg (1200x630, JPEG)

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import * as fontkit from 'fontkit';

const W = 1200;
const H = 630;

// Splits tokens (mirror DESIGN.md light mode).
const BG = '#FFFFFF';
const INK = '#111111';
const MUTED = '#6B6B6B';
const MARK = '#FFE81C';
const RULE = '#E4E4E1';

const font = fontkit.openSync(
	'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff',
);

// Lay out `str` at `size`px with the baseline at (x, y); returns SVG paths + measured width.
function drawText(str, size, x, y, fill) {
	const scale = size / font.unitsPerEm;
	const run = font.layout(str);
	let cursor = 0;
	const parts = [];
	run.glyphs.forEach((glyph, i) => {
		const pos = run.positions[i];
		const d = glyph.path.toSVG();
		if (d) {
			const gx = (x + (cursor + pos.xOffset) * scale).toFixed(2);
			const gy = (y - pos.yOffset * scale).toFixed(2);
			parts.push(`<path d="${d}" transform="translate(${gx} ${gy}) scale(${scale} ${-scale})" fill="${fill}"/>`);
		}
		cursor += pos.xAdvance;
	});
	return { svg: parts.join('\n\t'), width: cursor * scale };
}

const wordmark = drawText('nasser1931', 40, 80, 76, INK);
const TITLE_SIZE = 112;
const TITLE_BASELINE = 348;
const title = drawText('NASSER AL BUSAIDI', TITLE_SIZE, 80, TITLE_BASELINE, INK);
const subtitle = drawText('TRAINING, DATA, AND WRITING FROM MUSCAT', 44, 80, 440, MUTED);

// Marker rect sized from the measured title, like a real highlighter pass.
const capH = (font.capHeight / font.unitsPerEm) * TITLE_SIZE;
const markX = 68;
const markY = TITLE_BASELINE - capH - 14;
const markW = title.width + 24;
const markH = capH + 32;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<rect width="${W}" height="${H}" fill="${BG}"/>

	<!-- Wordmark + the heavy bar, like the top of a results sheet -->
	${wordmark.svg}
	<rect x="80" y="92" width="${W - 160}" height="6" fill="${INK}"/>

	<!-- Marker behind the name, then the name -->
	<rect x="${markX}" y="${markY.toFixed(2)}" width="${markW.toFixed(2)}" height="${markH.toFixed(2)}" fill="${MARK}"/>
	${title.svg}

	${subtitle.svg}

	<line x1="80" y1="${H - 130}" x2="${W - 80}" y2="${H - 130}" stroke="${RULE}" stroke-width="2"/>
	<text x="80" y="${H - 84}" font-family="monospace" font-size="24" fill="${MUTED}">nasser1931.com</text>
</svg>`;

const out = 'src/assets/og-fallback.jpg';
const buf = await sharp(Buffer.from(svg))
	.jpeg({ quality: 90, progressive: true })
	.toBuffer();

writeFileSync(out, buf);
console.log(`Wrote ${out} (${(buf.length / 1024).toFixed(1)}kb, ${W}x${H})`);
