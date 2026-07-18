#!/usr/bin/env node
// One-shot generator for the site's OG fallback image.
// Splits v1.0 palette + typography (see DESIGN.md). Re-run when the look changes.
//
// Output: src/assets/og-fallback.jpg (1200x630, JPEG)

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const W = 1200;
const H = 630;

// Splits tokens (mirror DESIGN.md light mode).
const BG = '#FFFFFF';
const INK = '#111111';
const MUTED = '#6B6B6B';
const MARK = '#FFE81C';
const RULE = '#E4E4E1';

// Embed Barlow Condensed 700 so the rasterizer doesn't fall back to a system face.
const fontPath = 'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2';
let fontFace = '';
try {
	const woff2 = readFileSync(fontPath).toString('base64');
	fontFace = `@font-face { font-family: 'Barlow Condensed'; font-weight: 700; src: url(data:font/woff2;base64,${woff2}) format('woff2'); }`;
} catch {
	// Fall back silently — Arial Narrow-ish system condensed will render instead.
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<style>
		${fontFace}
		text { font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif; }
	</style>
	<rect width="${W}" height="${H}" fill="${BG}"/>

	<!-- Heavy bar, like the top of a results sheet -->
	<rect x="80" y="90" width="${W - 160}" height="6" fill="${INK}"/>

	<!-- Wordmark -->
	<text x="80" y="80" font-weight="700" font-size="40" fill="${INK}">nasser1931</text>

	<!-- Marker behind the name -->
	<rect x="72" y="270" width="700" height="96" fill="${MARK}"/>
	<text x="80" y="348" font-weight="700" font-size="112" letter-spacing="-1" fill="${INK}">NASSER AL BUSAIDI</text>

	<text x="80" y="440" font-weight="700" font-size="44" fill="${MUTED}">TRAINING, DATA, AND WRITING FROM MUSCAT</text>

	<line x1="80" y1="${H - 130}" x2="${W - 80}" y2="${H - 130}" stroke="${RULE}" stroke-width="2"/>
	<text x="80" y="${H - 84}" font-family="monospace" font-size="24" fill="${MUTED}">nasser1931.com</text>
</svg>`;

const out = 'src/assets/og-fallback.jpg';
const buf = await sharp(Buffer.from(svg))
	.jpeg({ quality: 90, progressive: true })
	.toBuffer();

writeFileSync(out, buf);
console.log(`Wrote ${out} (${(buf.length / 1024).toFixed(1)}kb, ${W}x${H})`);
