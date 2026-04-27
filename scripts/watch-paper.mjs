#!/usr/bin/env node
// Watch the ProjecrFurnance paper source for prose and figure changes,
// re-run sync-paper on debounce. Pair with `astro dev` via npm run dev:paper.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const SOURCE = process.env.PAPER_SOURCE
  ? resolve(process.env.PAPER_SOURCE)
  : join(homedir(), 'Desktop/Personal/ProjecrFurnance/paper');

if (!existsSync(SOURCE)) {
  console.error(`[watch-paper] source dir not found: ${SOURCE}`);
  console.error(`[watch-paper] set PAPER_SOURCE env var to override`);
  process.exit(1);
}

let pending = false;
let running = false;

function runSync() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  const child = spawn(process.execPath, [join(__dirname, 'sync-paper.mjs')], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', () => {
    running = false;
    if (pending) {
      pending = false;
      runSync();
    }
  });
}

const watcher = chokidar.watch(
  [join(SOURCE, 'endurance-license/study.md'), join(SOURCE, 'endurance-license/figures')],
  {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 50 },
  },
);

watcher.on('add', (p) => {
  console.log(`[watch-paper] add ${p}`);
  runSync();
});
watcher.on('change', (p) => {
  console.log(`[watch-paper] change ${p}`);
  runSync();
});
watcher.on('unlink', (p) => {
  console.log(`[watch-paper] unlink ${p} (not removing dest, run sync-paper manually if needed)`);
});

console.log(`[watch-paper] watching ${SOURCE}`);
runSync();
