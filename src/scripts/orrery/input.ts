import * as THREE from 'three';
import type { CameraRig } from './camera';
import { isBody, type Info, type World } from './types';

const DRAG_THRESHOLD_PX = 4;
const TOUCH_REACH_PX = 28;
// Two clicks or taps on empty space within this long, and this close, are a double: back to the overview. Real double
// taps land 150-350 ms apart; the window leaves room for a slow one, and a finger drifts more than a mouse.
const DOUBLE_MS = 500;
const DOUBLE_PX = 32;
const DOUBLE_TOUCH_PX = 40;
// A tap on empty space while nothing is focused opens the Sky card, once no second tap can still make it a double.
const SKY_DELAY_MS = DOUBLE_MS + 20;
// Pinch on a trackpad arrives as a wheel event with a small deltaY; a mouse wheel with ctrl held is much larger.
const WHEEL_ZOOM_RATE = 0.012;
const WHEEL_STEP_MIN = 0.8;
const WHEEL_STEP_MAX = 1.25;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const probe = new THREE.Vector3();

type Handlers = {
  /** A body or moon was clicked. */
  onPick: (info: Info, hit: THREE.Object3D) => void;
  /** Empty space was clicked once: the overview if a body is in focus, otherwise the Sky card. */
  onEmpty: () => void;
  /** Empty space was clicked twice: back to the overview. */
  onReset: () => void;
  onHover: (info: Info | null) => void;
};

type Point = { x: number; y: number };

/**
 * Drag to orbit, click to pick, pinch or ctrl+wheel to zoom. Vertical swipes are left to the page so the hero never
 * traps scrolling on a phone, and a plain mouse wheel is left alone so the page still scrolls.
 */
export function attachInput(canvas: HTMLCanvasElement, rig: CameraRig, world: World, handlers: Handlers, signal: AbortSignal) {
  let drag: { x: number; y: number; theta: number; phi: number; moved: boolean } | null = null;
  const pointers = new Map<number, Point>();
  let pinch: { distance: number; zoom: number } | null = null;
  // Set once a second finger has touched, so lifting them is not read as a tap.
  let gesture = false;
  let lastEmpty: (Point & { time: number }) | null = null;
  let skyTimer: ReturnType<typeof setTimeout> | undefined;
  const opts = { signal };
  signal.addEventListener('abort', () => clearTimeout(skyTimer));

  const toNdc = (ev: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    return r;
  };

  // Planets a few pixels wide are hard to hit with a finger, so a miss falls back to the nearest body within reach.
  const nearest = (r: DOMRect) => {
    let best: THREE.Object3D | null = null;
    let bestPx = TOUCH_REACH_PX;
    for (const hit of world.pickables) {
      if (!isBody(hit.userData.info)) continue;
      hit.getWorldPosition(probe).project(rig.camera);
      const px = Math.hypot(((probe.x - ndc.x) * r.width) / 2, ((probe.y - ndc.y) * r.height) / 2);
      if (px < bestPx) [best, bestPx] = [hit, px];
    }
    return best;
  };

  const pick = (ev: PointerEvent) => {
    const r = toNdc(ev);
    raycaster.setFromCamera(ndc, rig.camera);
    return raycaster.intersectObjects(world.pickables, false)[0]?.object ?? (ev.pointerType === 'touch' ? nearest(r) : null);
  };

  const endDrag = () => {
    drag = null;
    rig.dragging = false;
  };

  const spread = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const isDouble = (ev: PointerEvent) =>
    !!lastEmpty && ev.timeStamp - lastEmpty.time < DOUBLE_MS
    && Math.hypot(ev.clientX - lastEmpty.x, ev.clientY - lastEmpty.y) < (ev.pointerType === 'touch' ? DOUBLE_TOUCH_PX : DOUBLE_PX);

  const forgetEmpty = () => {
    lastEmpty = null;
    clearTimeout(skyTimer);
    skyTimer = undefined;
  };

  const empty = (ev: PointerEvent) => {
    clearTimeout(skyTimer);
    lastEmpty = { x: ev.clientX, y: ev.clientY, time: ev.timeStamp };
    if (rig.focus) handlers.onEmpty();
    else skyTimer = setTimeout(handlers.onEmpty, SKY_DELAY_MS);
  };

  canvas.addEventListener('pointerdown', (ev) => {
    rig.cancelIntro();
    canvas.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 2) {
      // A second finger turns the drag into a pinch.
      gesture = true;
      endDrag();
      pinch = { distance: Math.max(1, spread()), zoom: rig.zoomLevel };
    } else if (pointers.size === 1) {
      gesture = false;
      drag = { x: ev.clientX, y: ev.clientY, theta: rig.theta, phi: rig.phi, moved: false };
      rig.dragging = true;
    }
  }, opts);
  canvas.addEventListener('pointermove', (ev) => {
    if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pinch && pointers.size >= 2) {
      // Fingers apart bring the camera closer.
      rig.setZoom((pinch.zoom * pinch.distance) / Math.max(1, spread()));
      return;
    }
    if (drag) {
      const dx = ev.clientX - drag.x;
      const dy = ev.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD_PX) drag.moved = true;
      rig.drag(drag.theta + dx * 0.006, drag.phi - dy * 0.005);
      return;
    }
    if (ev.pointerType !== 'mouse') return;
    const hit = pick(ev);
    handlers.onHover(hit ? hit.userData.info : null);
    canvas.classList.toggle('pointing', !!hit);
  }, opts);
  canvas.addEventListener('pointerup', (ev) => {
    const wasClick = !!drag && !drag.moved && !gesture;
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinch = null;
    endDrag();
    if (!wasClick) return;
    // Decided before looking at what is under the finger: the first tap may have started a fly-back, so a body
    // can have drifted under the second one. It still belongs to the double, and it must not open the Sky card.
    if (isDouble(ev)) {
      forgetEmpty();
      handlers.onReset();
      return;
    }
    const hit = pick(ev);
    if (hit) {
      forgetEmpty();
      handlers.onPick(hit.userData.info, hit);
    } else empty(ev);
  }, opts);
  // The browser takes over a vertical swipe to scroll the page and cancels the pointer.
  canvas.addEventListener('pointercancel', (ev) => {
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinch = null;
    endDrag();
  }, opts);
  canvas.addEventListener('pointerleave', () => {
    handlers.onHover(null);
    canvas.classList.remove('pointing');
  }, opts);
  // Only a pinch on a trackpad, or ctrl or cmd with the wheel, zooms. A plain wheel scrolls the page as usual.
  canvas.addEventListener('wheel', (ev) => {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    rig.zoomBy(Math.min(WHEEL_STEP_MAX, Math.max(WHEEL_STEP_MIN, Math.exp(ev.deltaY * WHEEL_ZOOM_RATE))));
  }, { signal, passive: false });
}
