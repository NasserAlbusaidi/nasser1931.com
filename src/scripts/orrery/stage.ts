import * as THREE from 'three';
import { REST_THETA, earthStartAngle, easeInOut, sphereDistance, systemReaches } from '../../lib/orrery';
import { knocker } from '../../lib/pluto.mjs';
import { enterRoom } from '../pluto/warp';
import { CameraRig, FOV } from './camera';
import { createCard } from './card';
import { attachInput } from './input';
import { resetLabelSizes, updateLabels } from './labels';
import { buildWorld, faceArabia, placeAnchors } from './scene';
import { loadTextures } from './textures';
import { isBody, isMoon, type Info, type Payload } from './types';

const MAX_DT = 0.05;
// The opening move: hold the first frame (Earth over the poster) while the poster fades out, then pull back to the system.
const HOLD_SECONDS = 0.5;
const PULL_BACK_SECONDS = 3.6;
// How far to the right of the camera the sun sits, seen from Earth, on the first frame: a mostly lit disc.
const SUN_OFFSET_RAD = 0.9;
// On the first frame the other bodies stand to the sides of the camera's bearing (radians from it), out of the
// close-up and off the path the camera takes as it pulls back, so none crosses the lens or covers the copy.
const START_ANGLES: Record<string, number> = { mars: Math.PI / 2, notes: -Math.PI / 2 + 0.6, saturn: -Math.PI / 2 - 0.35 };
// The illustrated Earth fills this share of its image's width.
const POSTER_SPHERE = 0.9;
// The labels come in once the pull-back is this far along, so none sit on the enlarged Earth.
const LABELS_AT = 0.55;
// How fast the orbit lines catch up (per second) when the opening move is cut short.
const ORBIT_CATCH_UP = 6;
// Room a label needs under the lowest body: a name and a sub-label on wide screens, the name alone on phones.
const LABEL_BELOW_PX = 46;
const LABEL_BELOW_PHONE_PX = 24;
const BOTTOM_BAND_PX = 70;
// Above this width the hero copy is laid over the canvas, and the system keeps clear of it.
const OVERLAY_MEDIA = '(min-width: 901px)';
// Phones show section names only, so a label needs less room under a body.
const PHONE_MEDIA = '(max-width: 600px)';
const TEXT_GAP_PX = 24;

// Each press of a zoom button changes the distance by this factor.
const ZOOM_STEP = 1.4;

/** How close the camera flies for a body: the sun and moons have their own framing. */
const closeness = (info: Info) => {
  if (isMoon(info)) return 3.5;
  if ('kind' in info) return info.kind === 'sun' ? 9 : Math.max(2.8, info.radius * 5);
  return 0;
};
/** The closest a zoom may bring the camera to it: never inside the body. */
const closest = (info: Info) => {
  if (isMoon(info)) return 0.6;
  if ('kind' in info) return info.radius * (info.kind === 'sun' ? 2.2 : 1.7);
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
    const card = createCard(root, () => overview(), signal);
    const part = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-orrery-${name}]`)!;
    const controls = part('controls');
    const overviewButton = part<HTMLButtonElement>('overview');
    const zoomInButton = part<HTMLButtonElement>('zoom-in');
    const zoomOutButton = part<HTMLButtonElement>('zoom-out');
    let showingOverview = false;
    let active: Info | null = null;
    let hovered: Info | null = null;
    let inView = true;
    let lost = false;
    let last = performance.now();
    // Earth and the orbits stand still until the pull-back starts, then speed up gradually.
    let clock = -HOLD_SECONDS;
    let motion = 0;
    let introLabels = false;
    let orbitFade = 0;
    const reaches = systemReaches(payload.bodies);
    const poster = root.querySelector<HTMLElement>('.orrery-poster');
    const overlay = matchMedia(OVERLAY_MEDIA);
    const phone = matchMedia(PHONE_MEDIA);
    const avoid = root.dataset.orreryAvoid ? document.querySelector(root.dataset.orreryAvoid) : null;
    // Where the text ends, measured from the canvas's left edge.
    const textEdge = () => (overlay.matches && avoid ? avoid.getBoundingClientRect().right - viewport.getBoundingClientRect().left + TEXT_GAP_PX : 0);

    const cardEl = part('card');
    // Where the card starts on the canvas, when it is laid over it (wide screens); a body in focus keeps clear of it.
    const cardCorner = () => {
      if (!overlay.matches || !card.isOpen) return null;
      const at = cardEl.getBoundingClientRect();
      const canvasBox = viewport.getBoundingClientRect();
      return { left: at.left - canvasBox.left, top: at.top - canvasBox.top };
    };
    const showCard = (info: Info) => {
      active = info;
      root.classList.add('has-card');
      card.open(info, Date.now());
      rig.setCard(cardCorner());
    };
    // Nine knocks on the Sun in a row open the hidden room.
    const sunKnocks = knocker();
    const open = (info: Info, hit: THREE.Object3D) => {
      if (isBody(info) && info.kind === 'sun' && sunKnocks.knock(performance.now())) return enterRoom('sun');
      showCard(info);
      // A moon has only its own radius; a body's fit includes its ring.
      if (hit.parent) rig.fly(hit.parent, closeness(info), closest(info), hit.parent.userData.focusRadius ?? hit.parent.userData.radius);
    };
    // Back to the whole system: card closed, nothing in focus, zoom reset.
    const overview = () => {
      active = null;
      root.classList.remove('has-card');
      card.close();
      rig.setCard(null);
      rig.overview();
    };
    // The Overview button shows while a body is in focus or the view is zoomed. If it had focus when it hid, keyboard focus moves on.
    const syncControls = () => {
      if (rig.away === showingOverview) return;
      showingOverview = rig.away;
      const hadFocus = document.activeElement === overviewButton;
      overviewButton.hidden = !showingOverview;
      if (hadFocus && !showingOverview) zoomInButton.focus();
    };
    attachInput(canvas, rig, world, {
      onPick: open,
      onEmpty: () => (rig.focus ? overview() : showCard(payload.sky)),
      onReset: overview,
      onHover: (info) => (hovered = info),
    }, signal);
    overviewButton.addEventListener('click', overview, { signal });
    zoomInButton.addEventListener('click', () => rig.zoomBy(1 / ZOOM_STEP), { signal });
    zoomOutButton.addEventListener('click', () => rig.zoomBy(ZOOM_STEP), { signal });
    controls.addEventListener('keydown', (ev) => {
      if (ev.key === '+' || ev.key === '=') rig.zoomBy(1 / ZOOM_STEP);
      else if (ev.key === '-' || ev.key === '_') rig.zoomBy(ZOOM_STEP);
    }, { signal });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && (card.isOpen || rig.away)) overview(); }, { signal });

    // Puts the camera close on Earth, with Earth over the poster: same centre, same diameter, Arabia facing us.
    const startOnPoster = () => {
      const earth = world.anchors.find((a) => a.userData.body.key === 'earth');
      const box = poster?.getBoundingClientRect();
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      if (!earth || !box?.width || !w || !h) return false;
      const canvasBox = viewport.getBoundingClientRect();
      const { radius, orbit } = earth.userData.body;
      earth.userData.angle = earthStartAngle(REST_THETA, SUN_OFFSET_RAD, orbit);
      for (const a of world.anchors) if (a.userData.body.key in START_ANGLES) a.userData.angle = REST_THETA + START_ANGLES[a.userData.body.key];
      placeAnchors(world, 0);
      faceArabia(world, rig.restDirection());
      rig.beginIntro(
        earth,
        sphereDistance((box.width * POSTER_SPHERE) / 2, h, FOV, radius),
        box.left + box.width / 2 - canvasBox.left - w / 2,
        box.top + box.height / 2 - canvasBox.top - h / 2,
        PULL_BACK_SECONDS,
        HOLD_SECONDS,
      );
      root.classList.add('is-intro');
      return true;
    };
    const resize = () => {
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      const beside = overlay.matches;
      rig.resize(w, h, reaches, { safeLeft: textEdge(), labelBelowPx: phone.matches ? LABEL_BELOW_PHONE_PX : LABEL_BELOW_PX, padBottomPx: beside ? BOTTOM_BAND_PX : undefined, card: cardCorner() });
      resetLabelSizes(world);
      draw();
    };
    // The orbit lines come in with the pull-back: the first frame is Earth, its moons and the stars, with no line
    // sweeping across the copy. If the opening move is cut short, they catch up instead of jumping.
    const fadeOrbits = (dt: number) => {
      // Eased twice over and squared: still 0 at the start and 1 at the end, but late enough that a line crossing the copy is faint.
      const target = easeInOut(rig.introProgress) ** 2;
      orbitFade += (target - orbitFade) * (dt > 0 ? 1 - Math.exp(-dt * ORBIT_CATCH_UP) : 1);
      for (const line of world.orbitLines) line.material.opacity = line.opacity * orbitFade;
    };
    const draw = (dt = 0) => {
      rig.update(dt);
      fadeOrbits(dt);
      renderer.render(world.scene, rig.camera);
      if (introLabels && rig.introProgress >= LABELS_AT) {
        introLabels = false;
        root.classList.remove('is-intro');
      }
      updateLabels(world, rig.camera, canvas, active, hovered);
      syncControls();
    };
    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(MAX_DT, (time - last) / 1000);
      last = time;
      if (motion < 1) {
        clock += dt;
        motion = easeInOut(clock / PULL_BACK_SECONDS);
      }
      placeAnchors(world, dt * motion);
      draw(dt);
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
    introLabels = startOnPoster();
    draw();
    root.classList.add('is-live');
    sync();
  } catch (error) {
    dispose();
    throw error;
  }
}
