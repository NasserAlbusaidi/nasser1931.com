import * as THREE from 'three';
import type { CameraRig } from './camera';
import { isBody, type Info, type World } from './types';

const DRAG_THRESHOLD_PX = 4;
const TOUCH_REACH_PX = 28;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const probe = new THREE.Vector3();

type Handlers = {
  onPick: (info: Info | null, hit: THREE.Object3D | null) => void;
  onHover: (info: Info | null) => void;
};

/** Drag to orbit, click to pick. Vertical swipes are left to the page so the hero never traps scrolling on a phone. */
export function attachInput(canvas: HTMLCanvasElement, rig: CameraRig, world: World, handlers: Handlers, signal: AbortSignal) {
  let drag: { x: number; y: number; theta: number; phi: number; moved: boolean } | null = null;
  const opts = { signal };

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

  canvas.addEventListener('pointerdown', (ev) => {
    drag = { x: ev.clientX, y: ev.clientY, theta: rig.theta, phi: rig.phi, moved: false };
    rig.dragging = true;
    canvas.setPointerCapture(ev.pointerId);
  }, opts);
  canvas.addEventListener('pointermove', (ev) => {
    if (drag) {
      const dx = ev.clientX - drag.x;
      const dy = ev.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD_PX) drag.moved = true;
      rig.drag(drag.theta + dx * 0.006, drag.phi - dy * 0.005);
      return;
    }
    const hit = pick(ev);
    handlers.onHover(hit ? hit.userData.info : null);
    canvas.classList.toggle('pointing', !!hit);
  }, opts);
  canvas.addEventListener('pointerup', (ev) => {
    const wasClick = !!drag && !drag.moved;
    endDrag();
    if (!wasClick) return;
    const hit = pick(ev);
    handlers.onPick(hit ? hit.userData.info : null, hit);
  }, opts);
  // The browser takes over a vertical swipe to scroll the page and cancels the pointer.
  canvas.addEventListener('pointercancel', endDrag, opts);
  canvas.addEventListener('pointerleave', () => {
    handlers.onHover(null);
    canvas.classList.remove('pointing');
  }, opts);
}
