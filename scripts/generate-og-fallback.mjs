#!/usr/bin/env node
// Reproducible typographic previews for section pages. The homepage uses its
// separately generated Earth artwork; articles use their own image, if any.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import * as fontkit from 'fontkit';
const font = fontkit.openSync('node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2');
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
			parts.push(`<path d="${d}" transform="translate(${gx} ${gy}) scale(${scale} ${-scale})" fill="${fill}" stroke="${fill}" stroke-width="0.7" vector-effect="non-scaling-stroke"/>`);
		}
		cursor += pos.xAdvance;
	});
	return { svg: parts.join('\n\t'), width: cursor * scale };
}


const cards = [
  ['projects', 'Projects.', 'Apps, research, and experiments worth sharing.', '/builds'],
  ['coach', 'Cycling coach.', 'A daily recommendation. A four-day outlook.', '/coach'],
  ['life', 'Life.', 'Long rides, strength sessions, and the training log.', '/field'],
  ['reading', 'On the shelf.', 'Currently reading and recently finished.', '/reading'],
  ['notes', 'Notes.', 'Small ideas, oddities, and things worth writing down.', '/stupidshit'],
];
mkdirSync('public/social', { recursive: true });
for (const [name, title, subtitle, route] of cards) {
  const heading = drawText(title, 108, 80, 330, '#EEF2F8');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#080D16"/>
    ${drawText('Nasser Al Busaidi', 30, 80, 90, '#A6B3C6').svg}
    <path d="M80 140H1120" stroke="#314159"/>
    ${heading.svg}
    ${drawText(subtitle, 33, 80, 407, '#A6B3C6').svg}
    <path d="M80 488H1120" stroke="#314159"/>
    ${drawText('nasser1931.com' + route, 28, 80, 550, '#E8BD85').svg}
  </svg>`;
  const output = await sharp(Buffer.from(svg)).jpeg({ quality: 88, progressive: true }).toBuffer();
  const path = `public/social/${name}.jpg`;
  writeFileSync(path, output);
  console.log(`${path}: ${output.length} bytes`);
}
