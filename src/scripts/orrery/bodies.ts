import * as THREE from 'three';
import type { Body } from '../../lib/orrery';
import { earthMaterial, halo } from './shaders';
import type { Textures, World } from './types';

const SEGMENTS: [number, number] = [64, 48];

/** Soft radial sprite texture, shared by the sun's halo and Muscat's light. */
export function glowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,226,180,1)');
  grd.addColorStop(0.25, 'rgba(232,189,133,.55)');
  grd.addColorStop(1, 'rgba(232,189,133,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Point on a SphereGeometry surface for a latitude/longitude, matching its equirectangular UVs.
export const latLon = (lat: number, lon: number, r: number) => {
  const u = ((lon + 180) / 360) * Math.PI * 2;
  const v = ((90 - lat) / 180) * Math.PI;
  return new THREE.Vector3(-r * Math.cos(u) * Math.sin(v), r * Math.cos(v), r * Math.sin(u) * Math.sin(v));
};

export const hitSphere = (radius: number) =>
  new THREE.Mesh(new THREE.SphereGeometry(Math.max(radius * 1.5, 0.35), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));

export function orbitLine(radius: number, dashed: boolean) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = dashed
    ? new THREE.LineDashedMaterial({ color: 0x4a5a74, dashSize: 0.15, gapSize: 0.25, transparent: true, opacity: 0.8 })
    : new THREE.LineBasicMaterial({ color: 0x33415a, transparent: true, opacity: 0.9 });
  const line = new THREE.Line(geometry, material);
  if (dashed) line.computeLineDistances();
  return line;
}

const spin = (world: World, obj: THREE.Object3D, speed: number) => {
  world.spinners.push({ obj, speed });
  return obj;
};

export function moonMesh(size: number, texture: THREE.Texture) {
  return new THREE.Mesh(new THREE.SphereGeometry(size, 48, 32), new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture, shininess: 6 }));
}

function earth(world: World, anchor: THREE.Group, tilt: THREE.Group, b: Body, t: Textures, glow: THREE.Texture) {
  tilt.rotation.z = 0.41;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(b.radius, ...SEGMENTS), earthMaterial(t.earthDay, t.earthNight));
  tilt.add(globe);
  spin(world, globe, 0.05);
  anchor.userData.globe = globe;
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(b.radius * 1.012, ...SEGMENTS),
    new THREE.MeshLambertMaterial({ map: t.earthClouds, alphaMap: t.cloudsAlpha, transparent: true, depthWrite: false, opacity: 0.85 }),
  );
  globe.add(clouds);
  spin(world, clouds, 0.012);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a3 }));
  pin.position.copy(latLon(23.59, 58.38, b.radius * 1.005)); // Muscat
  globe.add(pin);
  const pinGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pinGlow.scale.setScalar(0.16);
  pin.add(pinGlow);
  pin.userData = { radius: 0.02, moonOf: 'earth', occluder: anchor };
  anchor.userData.pin = pin;
  anchor.add(halo(b.radius * 1.12, 0x5a9cff, 2.4));
}

function rock(world: World, tilt: THREE.Group, b: Body, t: Textures) {
  const geo = new THREE.IcosahedronGeometry(b.radius, 2);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 0.78 + 0.3 * Math.sin(v.x * 21) * Math.cos(v.y * 17) + 0.12 * Math.sin(v.z * 31);
    p.setXYZ(i, v.x * k * 1.25, v.y * k * 0.85, v.z * k);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: t.rock, shininess: 2 }));
  tilt.add(mesh);
  spin(world, mesh, 0.4);
}

function gasPlanet(world: World, anchor: THREE.Group, tilt: THREE.Group, b: Body, t: Textures) {
  const isMars = b.key === 'mars';
  tilt.rotation.z = isMars ? 0.44 : 0.47;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(b.radius, ...SEGMENTS), new THREE.MeshPhongMaterial({ map: isMars ? t.mars : t.saturn, shininess: 3 }));
  tilt.add(globe);
  spin(world, globe, isMars ? 0.05 : 0.09);
  if (isMars) anchor.add(halo(b.radius * 1.06, 0xe0875a, 3.2));
  if (b.ring) ring(tilt, b, t.saturnRing);
}

// Saturn's rings, with the reading progress traced just outside them: one arc per book in the series.
function ring(tilt: THREE.Group, b: Body, ringTexture: THREE.Texture) {
  const series = b.ring!;
  const inner = b.radius * 1.24;
  const outer = b.radius * 2.27;
  const geo = new THREE.RingGeometry(inner, outer, 160, 1);
  const p = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  const disc = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: ringTexture, color: 0xd9ccb2, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  tilt.add(disc);
  const seg = (Math.PI * 2) / series.total;
  const gap = 0.05;
  const r0 = b.radius * 2.42;
  const r1 = b.radius * 2.47;
  for (let i = 0; i < series.total; i++) {
    const filled = Math.min(1, Math.max(0, series.done - i));
    const usable = seg - gap;
    const parts: [number, number, number, number][] = [
      [0, usable * filled, 0xe8bd85, 0.95],
      [usable * filled, usable * (1 - filled), 0x8894aa, 0.35],
    ];
    for (const [from, len, color, opacity] of parts) {
      if (len <= 0) continue;
      const arc = new THREE.Mesh(
        new THREE.RingGeometry(r0, r1, 32, 1, i * seg + from, len),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity, depthWrite: false }),
      );
      arc.rotation.x = -Math.PI / 2;
      tilt.add(arc);
    }
  }
}

export function sun(world: World, anchor: THREE.Group, b: Body, t: Textures, glow: THREE.Texture) {
  const core = new THREE.Mesh(new THREE.SphereGeometry(b.radius, ...SEGMENTS), new THREE.MeshBasicMaterial({ map: t.sun, color: 0xffe2b0 }));
  anchor.add(core);
  spin(world, core, 0.03);
  const halos: [number, number, number][] = [[4.5, 0.9, 0xfff0d8], [11, 0.35, 0xe8bd85]];
  for (const [scale, opacity, color] of halos) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity }));
    sprite.scale.setScalar(b.radius * scale);
    anchor.add(sprite);
  }
}

export function body(world: World, anchor: THREE.Group, b: Body, t: Textures, glow: THREE.Texture) {
  const tilt = new THREE.Group();
  anchor.add(tilt);
  if (b.key === 'earth') earth(world, anchor, tilt, b, t, glow);
  else if (b.kind === 'rock') rock(world, tilt, b, t);
  else gasPlanet(world, anchor, tilt, b, t);
}
