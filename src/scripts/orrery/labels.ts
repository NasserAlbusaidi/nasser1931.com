import * as THREE from 'three';
import type { Body } from '../../lib/orrery';
import { isBody, isMoon, type Info, type World } from './types';

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

const pos = new THREE.Vector3();
const ndc = new THREE.Vector3();
const center = new THREE.Vector3();
const toCam = new THREE.Vector3();

const keyOf = (info: Info | null) => (info && (isMoon(info) ? info.parent.key : isBody(info) ? info.key : null));

/** Projects each label onto the canvas. Moon and surface labels show only for the body in focus or under the pointer. */
export function updateLabels(w: World, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, active: Info | null, hovered: Info | null) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const focusKey = keyOf(active);
  const hoverKey = keyOf(hovered);
  const pxPerUnit = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
  for (const l of w.labels) {
    const showMoon = !l.moonOf || l.moonOf === focusKey || l.moonOf === hoverKey;
    l.target.getWorldPosition(pos);
    const dist = pos.distanceTo(camera.position);
    ndc.copy(pos).project(camera);
    let hidden = !showMoon || ndc.z > 1;
    const occluder: THREE.Object3D | undefined = l.target.userData.occluder;
    if (!hidden && occluder) {
      // A surface label is hidden while it faces away from the camera, on the far side of its planet.
      occluder.getWorldPosition(center);
      hidden = center.subVectors(pos, center).dot(toCam.subVectors(camera.position, pos)) < 0;
    }
    if (hidden) {
      l.el.style.display = 'none';
      continue;
    }
    l.el.style.display = '';
    l.el.style.left = `${((ndc.x + 1) / 2) * width}px`;
    l.el.style.top = `${((1 - ndc.y) / 2) * height + (l.offset * pxPerUnit) / dist + 6}px`;
    const info: Body | undefined = l.target.userData.body;
    l.el.classList.toggle('hot', !!info && info === hovered);
    l.el.classList.toggle('active', !!info && info === active);
  }
}
