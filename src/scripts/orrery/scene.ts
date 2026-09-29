import * as THREE from 'three';
import { motion, type Body } from '../../lib/orrery';
import * as parts from './bodies';
import { addLabel } from './labels';
import type { CameraRig } from './camera';
import type { Info, MoonInfo, Payload, Textures, World } from './types';

// Physically-based lights fall off with distance; the look was tuned with none, and their strength
// is in different units now. Pi and a zero decay reproduce the tuned brightness.
const LIGHT_SCALE = Math.PI;
const SPIN_EARTH = 0.05;
const ARABIA = { lat: 24, lon: 50 };

// Seeded so the stars are the same on every visit.
const seededRandom = () => {
  let s = 1931;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

function stars() {
  const rand = seededRandom();
  const n = 900;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 70 + rand() * 40;
    const t = rand() * Math.PI * 2;
    const p = Math.acos(2 * rand() - 1);
    pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xc9d3e6, size: 0.35, transparent: true, opacity: 0.7 }));
}

function addMoons(world: World, anchor: THREE.Group, b: Body, t: Textures, labelsEl: HTMLElement) {
  b.moons.forEach((m, i) => {
    const pivot = new THREE.Group();
    pivot.rotation.x = 0.25 * (i % 2 ? 1 : -1);
    pivot.rotation.z = 0.15 * i;
    anchor.add(pivot);
    const orbit = b.radius + 0.45 + i * 0.26;
    const size = 0.09 + (b.key === 'earth' ? 0.04 : 0);
    const moon = parts.moonMesh(size, b.key === 'earth' ? t.moon : t.rock);
    moon.position.set(orbit, 0, 0);
    moon.userData = { radius: size, moonOf: b.key };
    pivot.userData = { spin: (b.key === 'earth' ? 0.9 : 0.6) / (1 + i * 0.35), start: i * 1.3 };
    pivot.rotation.y = pivot.userData.start;
    pivot.add(moon);
    const hit = parts.hitSphere(size);
    moon.add(hit);
    hit.userData.info = { ...m, parent: b, isMoon: true } satisfies MoonInfo;
    world.pickables.push(hit);
    addLabel(labelsEl, world, m.name, '', moon, 'moon');
  });
}

function addBody(world: World, b: Body, t: Textures, glow: THREE.Texture, labelsEl: HTMLElement, now: number) {
  const anchor = new THREE.Group();
  anchor.userData = { body: b, angle: b.phase, speed: motion(b.changed, now).speed, radius: b.radius };
  world.scene.add(anchor);
  world.anchors.push(anchor);
  if (b.kind === 'sun') {
    parts.sun(world, anchor, b, t, glow);
  } else {
    world.scene.add(parts.orbitLine(b.orbit, b.kind === 'rock'));
    parts.body(world, anchor, b, t, glow);
    if (anchor.userData.pin) addLabel(labelsEl, world, 'Muscat', '', anchor.userData.pin, 'moon');
    addMoons(world, anchor, b, t, labelsEl);
    world.extent = Math.max(world.extent, b.orbit + b.radius * (b.ring ? 2.5 : 1.3));
  }
  const hit = parts.hitSphere(b.radius);
  anchor.add(hit);
  hit.userData.info = b satisfies Info;
  world.pickables.push(hit);
  addLabel(labelsEl, world, b.section, b.kind === 'sun' ? '' : b.name, anchor);
}

export function buildWorld(payload: Payload, t: Textures, labelsEl: HTMLElement, now: number): World {
  const world: World = { scene: new THREE.Scene(), anchors: [], pickables: [], labels: [], spinners: [], extent: 0 };
  world.scene.add(new THREE.AmbientLight(0xffffff, 0.08 * LIGHT_SCALE));
  world.scene.add(new THREE.PointLight(0xfff1dc, 2.85 * LIGHT_SCALE, 0, 0));
  world.scene.add(stars());
  const glow = parts.glowTexture();
  for (const b of payload.bodies) addBody(world, b, t, glow, labelsEl, now);
  placeAnchors(world, 0);
  return world;
}

export function placeAnchors(world: World, dt: number) {
  for (const a of world.anchors) {
    const b: Body = a.userData.body;
    if (b.kind === 'sun') continue;
    a.userData.angle += a.userData.speed * dt;
    a.position.set(Math.cos(a.userData.angle) * b.orbit, 0, Math.sin(a.userData.angle) * b.orbit);
    for (const child of a.children) if (child.userData.spin) child.rotation.y += child.userData.spin * dt;
  }
  for (const s of world.spinners) s.obj.rotation.y += s.speed * dt;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// Turn Earth so Arabia faces the camera once the opening move settles, `lead` seconds from now.
// Earth's axis is tilted, so the spin that centres Arabia is found by trying each angle and keeping the best.
export function faceArabia(world: World, rig: CameraRig, lead: number) {
  const earth = world.anchors.find((a) => a.userData.body.key === 'earth');
  const globe: THREE.Object3D | undefined = earth?.userData.globe;
  if (!earth || !globe?.parent) return;
  const { orbit }: Body = earth.userData.body;
  const angle = earth.userData.angle + earth.userData.speed * lead;
  const earthPos = new THREE.Vector3(Math.cos(angle) * orbit, 0, Math.sin(angle) * orbit);
  const toCam = rig.goalPosition().sub(earthPos).normalize();
  const arabia = parts.latLon(ARABIA.lat, ARABIA.lon, 1);
  const tilt = globe.parent.rotation.z;
  const v = new THREE.Vector3();
  let best = 0;
  let bestDot = -Infinity;
  for (let deg = 0; deg < 360; deg += 0.5) {
    const yaw = (deg * Math.PI) / 180;
    const dot = v.copy(arabia).applyAxisAngle(Y_AXIS, yaw).applyAxisAngle(Z_AXIS, tilt).dot(toCam);
    if (dot > bestDot) [best, bestDot] = [yaw, dot];
  }
  globe.rotation.y = best - SPIN_EARTH * lead;
}
