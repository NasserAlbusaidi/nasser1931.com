#!/usr/bin/env node
// One-shot generator for the site's OG fallback image.
// Field Journal palette + typography. Re-run when the look changes.
//
// Output: src/assets/og-fallback.jpg (1200x630, JPEG)

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const W = 1200;
const H = 630;

// Field Journal tokens (mirror DESIGN.md light mode).
const BG = '#FAF7F2';
const INK = '#1A1714';
const MUTED = '#6B655C';
const ACCENT = '#B85C1F';
const RULE = '#E5DED2';

// Letter-spacing 0.18em for the eyebrow at 22px ≈ 4px tracking.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<rect width="${W}" height="${H}" fill="${BG}"/>

	<!-- Hairline frame; not full border, just the corner accents like a notebook. -->
	<line x1="80" y1="80" x2="200" y2="80" stroke="${RULE}" stroke-width="1"/>
	<line x1="80" y1="80" x2="80" y2="200" stroke="${RULE}" stroke-width="1"/>
	<line x1="${W - 80}" y1="${H - 80}" x2="${W - 200}" y2="${H - 80}" stroke="${RULE}" stroke-width="1"/>
	<line x1="${W - 80}" y1="${H - 80}" x2="${W - 80}" y2="${H - 200}" stroke="${RULE}" stroke-width="1"/>

	<!-- Eyebrow: mono uppercase, 0.18em tracked -->
	<text x="80" y="170" font-family="monospace" font-size="22" font-weight="500" letter-spacing="4" fill="${MUTED}">FIELD&#160;REPORT&#160;·&#160;MUSCAT</text>

	<!-- Display title: Fraunces-like serif with optical sizing. Will fall back to system serif on the rasterizer. -->
	<text x="80" y="370" font-family="'Fraunces','Source Serif 4',Georgia,serif" font-weight="600" font-size="124" fill="${INK}" letter-spacing="-3">Nasser <tspan fill="${ACCENT}">Al Busaidi</tspan></text>

	<!-- Subtitle: serif italic -->
	<text x="80" y="445" font-family="'Source Serif 4',Georgia,serif" font-style="italic" font-size="32" fill="${INK}">Engineer in Muscat. Triathlete on the side.</text>
	<text x="80" y="485" font-family="'Source Serif 4',Georgia,serif" font-style="italic" font-size="32" fill="${INK}">Writes long things, occasionally retracts them.</text>

	<!-- Footer: site URL in mono -->
	<text x="80" y="${H - 110}" font-family="monospace" font-size="22" fill="${MUTED}">nasser1931.com</text>
</svg>`;

const out = 'src/assets/og-fallback.jpg';
const buf = await sharp(Buffer.from(svg))
	.jpeg({ quality: 90, progressive: true })
	.toBuffer();

writeFileSync(out, buf);
console.log(`Wrote ${out} (${(buf.length / 1024).toFixed(1)}kb, ${W}×${H})`);
