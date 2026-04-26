#!/usr/bin/env node
// Sync the paper's raw v1 and figures from ProjecrFurnance into public/paper/.
// The published prose lives in src/pages/paper/index.md and is edited in-repo;
// this script only mirrors the v1 receipts file and the figure PNGs.
// Override the source dir with PAPER_SOURCE env var.

import { mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const SOURCE = process.env.PAPER_SOURCE
  ? resolve(process.env.PAPER_SOURCE)
  : join(homedir(), 'Desktop/Personal/ProjecrFurnance/paper');

const DEST_DIR = join(REPO_ROOT, 'public/paper');
const DEST_FIGURES = join(DEST_DIR, 'figures');

async function syncFile(src, dest) {
  if (!existsSync(src)) {
    throw new Error(`source missing: ${src}`);
  }
  await mkdir(dirname(dest), { recursive: true });

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

async function syncFigures(srcDir, destDir) {
  if (!existsSync(srcDir)) {
    throw new Error(`figures source missing: ${srcDir}`);
  }
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir);
  const pngs = entries.filter((f) => f.endsWith('.png'));
  let copied = 0;
  for (const name of pngs) {
    if (await syncFile(join(srcDir, name), join(destDir, name))) copied++;
  }
  return { total: pngs.length, copied };
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`[sync-paper] source dir not found: ${SOURCE}`);
    console.error(`[sync-paper] set PAPER_SOURCE env var to override`);
    process.exit(1);
  }

  console.log(`[sync-paper] source: ${SOURCE}`);

  const v1Updated = await syncFile(
    join(SOURCE, 'study-v1.md'),
    join(DEST_DIR, 'study-v1.md'),
  );
  console.log(`[sync-paper] study-v1.md: ${v1Updated ? 'updated' : 'unchanged'}`);

  const figs = await syncFigures(join(SOURCE, 'figures'), DEST_FIGURES);
  console.log(`[sync-paper] figures: ${figs.copied}/${figs.total} updated`);
}

main().catch((err) => {
  console.error(`[sync-paper] ${err.message}`);
  process.exit(1);
});
