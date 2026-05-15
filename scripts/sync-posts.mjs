#!/usr/bin/env node
// Pulls posts from a Notion database and writes them into the Astro
// content collections (src/content/field or src/content/stupidshit).
//
// Notion database schema (required):
//   Title       (title)
//   Slug        (rich_text, optional — auto-derived from title if blank)
//   Summary     (rich_text)
//   Date        (date)
//   Status      (select: Draft | Published)   only Published rows are written
//   Collection  (select: stupidshit | field)  defaults to stupidshit
//   Tags        (multi_select, optional)
//
// Env: NOTION_TOKEN     internal integration token
//      NOTION_POSTS_DB  database id (uuid)
//
// Side effects:
//   - writes/overwrites files in src/content/{collection}/<date>-<slug>.md
//   - downloads Notion-hosted images into public/posts/<slug>/ and rewrites
//     markdown to point at the local copy
//   - removes locally any file whose notion_id is no longer Published
//
// Idempotent: skips writes when content is byte-identical to disk.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TOKEN = (process.env.NOTION_TOKEN || '').trim();
const DB_ID = (process.env.NOTION_POSTS_DB || '8274ed5c50304f20a598bf7bb30d7d3f').trim();
const NOTION_VERSION = '2022-06-28';

if (!TOKEN) {
	console.error('Missing NOTION_TOKEN');
	process.exit(1);
}

const HEADERS = {
	Authorization: `Bearer ${TOKEN}`,
	'Notion-Version': NOTION_VERSION,
	'Content-Type': 'application/json',
};

const ALLOWED_COLLECTIONS = new Set(['stupidshit', 'field']);
const DEFAULT_COLLECTION = 'stupidshit';

// ---------- Notion API helpers ----------

const notion = async (urlPath, init = {}) => {
	const res = await fetch(`https://api.notion.com/v1${urlPath}`, {
		...init,
		headers: { ...HEADERS, ...(init.headers || {}) },
	});
	if (!res.ok) {
		const txt = await res.text().catch(() => '');
		throw new Error(`Notion ${urlPath} failed: ${res.status} ${res.statusText}\n${txt.slice(0, 600)}`);
	}
	return res.json();
};

const queryDatabase = async () => {
	const all = [];
	let cursor;
	do {
		const body = {
			page_size: 100,
			filter: { property: 'Status', select: { equals: 'Published' } },
			sorts: [{ property: 'Date', direction: 'descending' }],
		};
		if (cursor) body.start_cursor = cursor;
		const data = await notion(`/databases/${DB_ID}/query`, {
			method: 'POST',
			body: JSON.stringify(body),
		});
		all.push(...(data.results || []));
		cursor = data.has_more ? data.next_cursor : null;
	} while (cursor);
	return all;
};

const fetchChildren = async (blockId) => {
	const all = [];
	let cursor;
	do {
		const qs = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100';
		const data = await notion(`/blocks/${blockId}/children${qs}`);
		all.push(...(data.results || []));
		cursor = data.has_more ? data.next_cursor : null;
	} while (cursor);
	return all;
};

// ---------- Property readers ----------

const propText = (p) => {
	if (!p) return null;
	const arr = p.title || p.rich_text;
	if (!Array.isArray(arr) || arr.length === 0) return null;
	return arr.map((seg) => seg.plain_text).join('').trim() || null;
};
const propSelect = (p) => p?.select?.name ?? null;
const propMulti = (p) => (p?.multi_select || []).map((opt) => opt.name);
const propDate = (p) => p?.date?.start ?? null;

// ---------- Slug + rich text ----------

const slugify = (s) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80) || 'untitled';

const escapeMd = (s) => s.replace(/([\\`*_{}\[\]()#+\-!])/g, '\\$1');

const renderRichText = (arr) => {
	if (!Array.isArray(arr)) return '';
	return arr
		.map((seg) => {
			let text = seg.plain_text ?? '';
			const a = seg.annotations || {};
			if (a.code) text = '`' + text + '`';
			else text = escapeMd(text);
			if (a.bold) text = `**${text}**`;
			if (a.italic) text = `*${text}*`;
			if (a.strikethrough) text = `~~${text}~~`;
			const href = seg.href;
			if (href) text = `[${text}](${href})`;
			return text;
		})
		.join('');
};

// ---------- Image mirroring ----------

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const downloadTo = async (url, dest) =>
	new Promise(async (resolve, reject) => {
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`download ${url} failed: ${res.status}`);
			const buf = Buffer.from(await res.arrayBuffer());
			fs.writeFileSync(dest, buf);
			resolve(dest);
		} catch (e) {
			reject(e);
		}
	});

const mirrorImage = async (block, slug) => {
	const img = block.image;
	const url = img.type === 'external' ? img.external.url : img.file.url;
	const ext = (() => {
		const m = url.split('?')[0].match(/\.([a-zA-Z0-9]{2,5})$/);
		return m ? m[1].toLowerCase() : 'jpg';
	})();
	const hash = crypto.createHash('sha1').update(block.id).digest('hex').slice(0, 10);
	const filename = `${hash}.${ext}`;
	const dir = path.resolve('public/posts', slug);
	ensureDir(dir);
	const dest = path.join(dir, filename);
	if (!fs.existsSync(dest)) {
		await downloadTo(url, dest);
	}
	const caption = renderRichText(img.caption || []);
	const alt = caption || 'image';
	return `![${alt}](/posts/${slug}/${filename})`;
};

// ---------- Block → markdown ----------

const renderBlock = async (block, slug, depth = 0) => {
	const pad = '\t'.repeat(depth);
	const type = block.type;
	const data = block[type];

	switch (type) {
		case 'paragraph':
			return pad + renderRichText(data.rich_text);
		case 'heading_1':
			return pad + '# ' + renderRichText(data.rich_text);
		case 'heading_2':
			return pad + '## ' + renderRichText(data.rich_text);
		case 'heading_3':
			return pad + '### ' + renderRichText(data.rich_text);
		case 'bulleted_list_item':
			return pad + '- ' + renderRichText(data.rich_text);
		case 'numbered_list_item':
			return pad + '1. ' + renderRichText(data.rich_text);
		case 'to_do':
			return pad + `- [${data.checked ? 'x' : ' '}] ` + renderRichText(data.rich_text);
		case 'quote':
			return pad + '> ' + renderRichText(data.rich_text);
		case 'callout': {
			const icon = data.icon?.emoji ? `${data.icon.emoji} ` : '';
			return pad + '> ' + icon + renderRichText(data.rich_text);
		}
		case 'code': {
			const lang = data.language || '';
			const body = (data.rich_text || []).map((s) => s.plain_text).join('');
			return pad + '```' + lang + '\n' + body + '\n' + pad + '```';
		}
		case 'divider':
			return pad + '---';
		case 'image':
			return pad + (await mirrorImage(block, slug));
		case 'bookmark':
		case 'link_preview':
		case 'embed': {
			const url = data.url;
			return pad + `[${url}](${url})`;
		}
		case 'toggle': {
			const summary = renderRichText(data.rich_text);
			return pad + `<details><summary>${summary}</summary>\n\n${pad}</details>`;
		}
		case 'table_of_contents':
		case 'breadcrumb':
		case 'column_list':
		case 'column':
			return '';
		default:
			// Unknown / unsupported — fall back to plain rich text if present
			if (data?.rich_text) return pad + renderRichText(data.rich_text);
			return '';
	}
};

const renderBlocks = async (blocks, slug, depth = 0) => {
	const lines = [];
	for (const block of blocks) {
		const rendered = await renderBlock(block, slug, depth);
		if (rendered !== '') lines.push(rendered);
		if (block.has_children) {
			const children = await fetchChildren(block.id);
			const inner = await renderBlocks(children, slug, depth + 1);
			if (inner) lines.push(inner);
		}
	}
	return lines.join('\n\n');
};

// ---------- Frontmatter ----------

const yamlString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const buildFrontmatter = ({ title, summary, date, tags, notionId }) => {
	const lines = ['---'];
	lines.push(`title: ${yamlString(title)}`);
	lines.push(`summary: ${yamlString(summary)}`);
	lines.push(`date: ${date}`);
	if (tags && tags.length) {
		lines.push(`tags: [${tags.map(yamlString).join(', ')}]`);
	}
	lines.push(`notion_id: ${yamlString(notionId)}`);
	lines.push('---');
	return lines.join('\n');
};

// ---------- Local file scan ----------

const readNotionIdFromFile = (filePath) => {
	const raw = fs.readFileSync(filePath, 'utf8');
	const m = raw.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	const idLine = m[1].split('\n').find((l) => l.startsWith('notion_id:'));
	if (!idLine) return null;
	return idLine.replace(/^notion_id:\s*/, '').trim().replace(/^"|"$/g, '');
};

const scanExisting = (collection) => {
	const dir = path.resolve('src/content', collection);
	if (!fs.existsSync(dir)) return new Map();
	const out = new Map();
	for (const name of fs.readdirSync(dir)) {
		if (!name.endsWith('.md') && !name.endsWith('.mdx')) continue;
		const full = path.join(dir, name);
		const id = readNotionIdFromFile(full);
		if (id) out.set(id, full);
	}
	return out;
};

// ---------- Main ----------

const main = async () => {
	const pages = await queryDatabase();
	console.log(`Notion returned ${pages.length} Published page(s).`);

	const existing = {
		stupidshit: scanExisting('stupidshit'),
		field: scanExisting('field'),
	};
	const seen = { stupidshit: new Set(), field: new Set() };
	const seenSlugs = new Set();

	let wrote = 0;
	let skipped = 0;
	let moved = 0;

	for (const page of pages) {
		const props = page.properties || {};
		const title = propText(props.Title) || '(untitled)';
		const summary = propText(props.Summary) || '';
		const date = propDate(props.Date) || page.created_time.slice(0, 10);
		const slugRaw = propText(props.Slug);
		const slug = slugRaw ? slugify(slugRaw) : slugify(title);
		const tags = propMulti(props.Tags);
		const rawCollection = propSelect(props.Collection);
		const collection = ALLOWED_COLLECTIONS.has(rawCollection) ? rawCollection : DEFAULT_COLLECTION;
		const notionId = page.id;

		const blocks = await fetchChildren(page.id);
		const body = await renderBlocks(blocks, slug);
		const frontmatter = buildFrontmatter({ title, summary, date, tags, notionId });
		const content = `${frontmatter}\n\n${body}\n`;

		const filename = `${date}-${slug}.md`;
		const targetPath = path.resolve('src/content', collection, filename);
		ensureDir(path.dirname(targetPath));

		const existingPath = existing.stupidshit.get(notionId) || existing.field.get(notionId);

		if (existingPath && existingPath !== targetPath) {
			fs.unlinkSync(existingPath);
			moved++;
		}

		const prev = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;
		if (prev === content) {
			skipped++;
		} else {
			fs.writeFileSync(targetPath, content);
			wrote++;
		}

		seen[collection].add(notionId);
		seenSlugs.add(slug);
	}

	let removed = 0;
	for (const col of ['stupidshit', 'field']) {
		for (const [id, filePath] of existing[col]) {
			if (!seen[col].has(id) && !seen[col === 'stupidshit' ? 'field' : 'stupidshit'].has(id)) {
				fs.unlinkSync(filePath);
				removed++;
			}
		}
	}

	let removedImageDirs = 0;
	const imagesRoot = path.resolve('public/posts');
	if (fs.existsSync(imagesRoot)) {
		for (const name of fs.readdirSync(imagesRoot)) {
			if (!seenSlugs.has(name)) {
				fs.rmSync(path.join(imagesRoot, name), { recursive: true, force: true });
				removedImageDirs++;
			}
		}
	}

	console.log(`wrote=${wrote} skipped=${skipped} moved=${moved} removed=${removed} removedImageDirs=${removedImageDirs}`);
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
