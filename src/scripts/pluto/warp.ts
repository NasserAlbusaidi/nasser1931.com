import { ROOM } from '../../lib/pluto.mjs';

// The room reads this once to say which way you came in, then forgets it, so the URL stays plain.
export const VIA_KEY = 'np-pluto-via';
const WARP_MS = 900;
const STARS = 420;

let leaving = false;
let overlay: HTMLCanvasElement | null = null;

// Back from the room, a page restored from the back-forward cache would still be mid-warp: black, and deaf to every way in.
addEventListener('pageshow', (ev) => {
  if (!ev.persisted) return;
  overlay?.remove();
  overlay = null;
  leaving = false;
});

/** A short jump to light speed, then the room. Straight there under reduced motion. */
export function enterRoom(way: string) {
  if (leaving || location.pathname === ROOM) return;
  leaving = true;
  try { sessionStorage.setItem(VIA_KEY, way); } catch (_) { /* private mode: the room just won't know how */ }
  const go = () => location.assign(ROOM);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return go();

  const canvas = (overlay = document.createElement('canvas'));
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', zIndex: '2147483647', pointerEvents: 'none' });
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return go();
  const dpr = Math.min(devicePixelRatio, 2);
  const w = (canvas.width = innerWidth * dpr);
  const h = (canvas.height = innerHeight * dpr);
  const stars = Array.from({ length: STARS }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 0.2 + Math.random() * 0.8 }));
  const project = (x: number, z: number, size: number) => size / 2 + (x / z) * (size / 2) * 0.35;
  const start = performance.now();
  let lastT = 0;

  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / WARP_MS);
    const dz = (t * t - lastT * lastT) * 0.95;
    lastT = t;
    ctx.fillStyle = `rgba(4, 6, 11, ${0.25 + 0.75 * t})`;
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (const s of stars) {
      const from = s.z;
      s.z = Math.max(0.02, s.z - dz);
      const x0 = project(s.x, from, w), y0 = project(s.y, from, h);
      const x1 = project(s.x, s.z, w), y1 = project(s.y, s.z, h);
      ctx.strokeStyle = s.z < 0.3 ? 'rgba(232, 189, 133, .9)' : 'rgba(201, 211, 230, .85)';
      ctx.lineWidth = dpr * (1.6 - s.z);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      if (s.z <= 0.02) Object.assign(s, { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 1 });
    }
    if (t < 1) requestAnimationFrame(frame);
    else go();
  };
  requestAnimationFrame(frame);
}
