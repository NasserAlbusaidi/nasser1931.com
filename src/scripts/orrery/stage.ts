import * as THREE from 'three';
import { CameraRig } from './camera';
import { createCard } from './card';
import { attachInput } from './input';
import { updateLabels } from './labels';
import { buildWorld, faceArabia, placeAnchors } from './scene';
import { loadTextures } from './textures';
import { isMoon, type Info, type Payload } from './types';

const MAX_DT = 0.05;
const INTRO_SECONDS = 2.6;
// Under this width the projected labels are hidden; a tap still opens the card.
const LABELS_MEDIA = '(min-width: 601px)';

/** How close the camera flies for a body: the sun and moons have their own framing. */
const closeness = (info: Info) => {
  if (isMoon(info)) return 3.5;
  if ('kind' in info) return info.kind === 'sun' ? 9 : Math.max(2.8, info.radius * 5);
  return 0;
};

/**
 * Builds the solar system inside `root` and starts drawing it. Resolves once the first frame is
 * on screen; rejects (after cleaning up) if WebGL or a texture fails, so the caller keeps the poster.
 */
export async function startOrrery(root: HTMLElement, payload: Payload) {
  const viewport = root.querySelector<HTMLElement>('[data-orrery-viewport]')!;
  const labelsEl = root.querySelector<HTMLElement>('[data-orrery-labels]')!;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const controller = new AbortController();
  const { signal } = controller;
  let raf = 0;
  const observers: { disconnect(): void }[] = [];
  const dispose = () => {
    controller.abort();
    cancelAnimationFrame(raf);
    observers.forEach((o) => o.disconnect());
    renderer.dispose();
    renderer.domElement.remove();
  };

  try {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    viewport.prepend(canvas);

    const textures = await loadTextures(payload.textures, renderer.capabilities.getMaxAnisotropy());
    const now = Date.now();
    const world = buildWorld(payload, textures, labelsEl, now);
    const rig = new CameraRig();
    const card = createCard(root, () => close(), signal);
    let active: Info | null = null;
    let hovered: Info | null = null;
    let inView = true;
    let lost = false;
    let last = performance.now();
    const wide = matchMedia(LABELS_MEDIA);

    const open = (info: Info, hit: THREE.Object3D | null) => {
      active = info;
      card.open(info, Date.now());
      if (hit?.parent) rig.fly(hit.parent, closeness(info));
      else rig.release();
    };
    const close = () => {
      active = null;
      card.close();
      rig.release();
    };
    attachInput(canvas, rig, world, {
      onPick: (info, hit) => open(info ?? payload.sky, hit),
      onHover: (info) => (hovered = info),
    }, signal);
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && card.isOpen) close(); }, { signal });

    const resize = () => {
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      rig.resize(w / h, world.extent);
      draw();
    };
    const draw = () => {
      rig.update();
      renderer.render(world.scene, rig.camera);
      if (wide.matches) updateLabels(world, rig.camera, canvas, active, hovered);
    };
    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(MAX_DT, (time - last) / 1000);
      last = time;
      placeAnchors(world, dt);
      draw();
    };
    // Off screen or in a background tab there is nothing to see, so the loop stops.
    const sync = () => {
      const run = inView && !document.hidden && !lost;
      if (run && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const visibility = new IntersectionObserver((entries) => { inView = entries[entries.length - 1].isIntersecting; sync(); }, { rootMargin: '100px' });
    const resizer = new ResizeObserver(resize);
    observers.push(visibility, resizer);
    visibility.observe(viewport);
    resizer.observe(viewport);
    document.addEventListener('visibilitychange', sync, { signal });
    canvas.addEventListener('webglcontextlost', (ev) => {
      ev.preventDefault();
      lost = true;
      sync();
      root.classList.remove('is-live');
      console.error('Orrery: the WebGL context was lost; showing the static Earth.');
    }, { signal });

    resize();
    rig.beginIntro();
    faceArabia(world, rig, INTRO_SECONDS);
    draw();
    root.classList.add('is-live');
    sync();
  } catch (error) {
    dispose();
    throw error;
  }
}
