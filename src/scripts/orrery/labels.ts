import * as THREE from 'three';
import type { Body } from '../../lib/orrery';
import { isBody, isMoon, type Info, type LabelSpec, type World } from './types';

export function addLabel(container: HTMLElement, world: World, text: string, sub: string, target: THREE.Object3D, cls = '') {
  const el = document.createElement('div');
  el.className = `orrery-label${cls ? ` ${cls}` : ''}`;
  el.append(text);
  if (sub) {
    const small = document.createElement('small');
    small.textContent = sub;
    el.append(small);
  }
  container.append(el);
  world.labels.push({ el, target, offset: target.userData.radius || 0.2, moonOf: target.userData.moonOf });
}

/** Sizes are read once, then reused; call this when the layout changes (a resize can show or hide sub-labels). */
export const resetLabelSizes = (world: World) => {
  for (const l of world.labels) l.width = l.height = undefined;
};

const pos = new THREE.Vector3();
const ndc = new THREE.Vector3();
const center = new THREE.Vector3();
const toCam = new THREE.Vector3();

const keyOf = (info: Info | null) => (info && (isMoon(info) ? info.parent.key : isBody(info) ? info.key : null));

type Placed = { l: LabelSpec; x: number; y: number; w: number; h: number; priority: number };
type Disc = { x: number; y: number; r: number; key: string };

const GAP_PX = 4;
const FOCUS_PRIORITY = 1e6;
const SURFACE_PRIORITY = 5e5;

const overlapsBox = (a: Placed, b: Placed) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 + GAP_PX && a.y < b.y + b.h + GAP_PX && b.y < a.y + a.h + GAP_PX;

const overlapsDisc = (a: Placed, d: Disc) => {
  const nearestX = Math.min(a.x + a.w / 2, Math.max(a.x - a.w / 2, d.x));
  const nearestY = Math.min(a.y + a.h, Math.max(a.y, d.y));
  return Math.hypot(nearestX - d.x, nearestY - d.y) < d.r + GAP_PX;
};

/**
 * Projects each label onto the canvas, under its body. Moon and surface labels show only for the body in focus
 * or under the pointer, and with a body in focus the other bodies' labels are dropped. Where two labels would overlap, the one for the smaller or farther body gives way (the one
 * in focus or hovered never does), and a label never sits on another body's sphere.
 */
export function updateLabels(w: World, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, active: Info | null, hovered: Info | null) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const focusKey = keyOf(active);
  const hoverKey = keyOf(hovered);
  const pxPerUnit = height / (2 * Math.tan((camera.fov * Math.PI) / 360));

  const discs: Disc[] = w.anchors.map((a) => {
    a.getWorldPosition(pos);
    const dist = pos.distanceTo(camera.position);
    ndc.copy(pos).project(camera);
    return { x: ((ndc.x + 1) / 2) * width, y: ((1 - ndc.y) / 2) * height, r: (a.userData.radius * pxPerUnit) / dist, key: a.userData.body.key };
  });

  const candidates: Placed[] = [];
  for (const l of w.labels) {
    const showMoon = !l.moonOf || l.moonOf === focusKey || l.moonOf === hoverKey;
    l.target.getWorldPosition(pos);
    const dist = pos.distanceTo(camera.position);
    ndc.copy(pos).project(camera);
    // With a body in focus, only its own labels stay: the rest would sit over the copy or the card.
    const other = !!focusKey && l.moonOf !== focusKey && l.target.userData.body?.key !== focusKey;
    let hidden = !showMoon || ndc.z > 1 || other;
    const occluder: THREE.Object3D | undefined = l.target.userData.occluder;
    if (!hidden && occluder) {
      // A surface label is hidden while it faces away from the camera, on the far side of its planet.
      occluder.getWorldPosition(center);
      hidden = center.subVectors(pos, center).dot(toCam.subVectors(camera.position, pos)) < 0;
    }
    if (!hidden && l.width === undefined) {
      l.el.style.display = '';
      l.width = l.el.offsetWidth;
      l.height = l.el.offsetHeight;
    }
    // A width of 0 means the stylesheet hides this label at this size.
    if (hidden || !l.width) {
      l.el.style.display = 'none';
      continue;
    }
    const info: Body | undefined = l.target.userData.body;
    const px = l.offset * pxPerUnit / dist;
    const priority = (info && (info === active || info === hovered)) ? FOCUS_PRIORITY
      : l.moonOf ? SURFACE_PRIORITY
        : ((info?.radius ?? 0) * pxPerUnit) / dist;
    candidates.push({ l, x: ((ndc.x + 1) / 2) * width, y: ((1 - ndc.y) / 2) * height + px + 6, w: l.width, h: l.height ?? 0, priority });
  }

  candidates.sort((a, b) => b.priority - a.priority);
  const kept: Placed[] = [];
  const shown = new Set<LabelSpec>();
  for (const c of candidates) {
    const own = c.l.target.userData.body?.key ?? c.l.moonOf;
    // The Muscat pin label belongs on Earth's surface, so Earth's own disc does not count against it.
    const onSphere = !c.l.target.userData.occluder && discs.some((d) => d.key !== own && overlapsDisc(c, d));
    if (onSphere || kept.some((k) => overlapsBox(c, k))) continue;
    kept.push(c);
    shown.add(c.l);
  }
  for (const c of candidates) {
    const { l } = c;
    if (!shown.has(l)) {
      l.el.style.display = 'none';
      continue;
    }
    l.el.style.display = '';
    l.el.style.left = `${c.x}px`;
    l.el.style.top = `${c.y}px`;
    const info: Body | undefined = l.target.userData.body;
    l.el.classList.toggle('hot', !!info && info === hovered);
    l.el.classList.toggle('active', !!info && info === active);
  }
}
