import type { Payload } from './types';

// Everything here runs before three.js is downloaded, so the poster paints first and
// people who cannot or should not run WebGL never pay for the chunk.
const NEAR_VIEWPORT = '200px';

const wantsStill = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

const readPayload = (root: HTMLElement): Payload | null => {
  try {
    return JSON.parse(root.querySelector('[data-orrery-data]')!.textContent!);
  } catch (error) {
    console.error('Orrery: could not read the section data; keeping the static Earth.', error);
    return null;
  }
};

const whenIdle = (run: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 2000 }) : setTimeout(run, 0));

export function mountOrrery() {
  const root = document.querySelector<HTMLElement>('[data-orrery]');
  if (!root || wantsStill()) return;
  const payload = readPayload(root);
  if (!payload) return;

  const load = async () => {
    try {
      const { startOrrery } = await import('./stage');
      await startOrrery(root, payload);
    } catch (error) {
      console.error('Orrery: could not start the 3D view; keeping the static Earth.', error);
    }
  };
  const watch = () => {
    const seen = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      seen.disconnect();
      void load();
    }, { rootMargin: NEAR_VIEWPORT });
    seen.observe(root.querySelector('[data-orrery-viewport]')!);
  };
  // After the poster (the LCP element) has loaded and painted.
  if (document.readyState === 'complete') whenIdle(watch);
  else addEventListener('load', () => whenIdle(watch), { once: true });
}
