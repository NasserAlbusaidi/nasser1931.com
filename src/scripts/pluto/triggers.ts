import { KONAMI, NAME, keyWatcher } from '../../lib/pluto.mjs';
import { enterRoom } from './warp';

// The ways into /pluto that work on every page. The Sun's knocks live in the orrery (stage.ts).

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

const keys = keyWatcher({ konami: KONAMI, name: NAME });
addEventListener('keydown', (ev) => {
  if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey || typing(ev.target)) return;
  const way = keys.feed(ev.key);
  if (way) enterRoom(way);
});

// A link that is itself a way in (the 404 page's far-off dot) says which, and warps instead of just loading.
addEventListener('click', (ev) => {
  const link = (ev.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-pluto-way]');
  if (!link || ev.defaultPrevented || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
  ev.preventDefault();
  enterRoom(link.dataset.plutoWay!);
});

// For anyone who opens the console.
Object.assign(window, { pluto: () => { enterRoom('console'); return 'Hold on.'; } });
console.log(
  '%c✦ nasser1931.com%c\nPoking around? There is a ninth body out past Saturn.\nType %cpluto()%c and press enter.',
  'color:#e8bd85;font:600 14px/1.6 system-ui,sans-serif;letter-spacing:.12em',
  'color:#a6b3c6;font:13px/1.6 system-ui,sans-serif',
  'color:#e8bd85;font:13px/1.6 ui-monospace,monospace',
  'color:#a6b3c6;font:13px/1.6 system-ui,sans-serif',
);
