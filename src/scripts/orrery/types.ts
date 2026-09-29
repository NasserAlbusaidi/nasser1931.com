import type * as THREE from 'three';
import type { Body, Moon, Sky } from '../../lib/orrery';

export type TextureKey = 'earthDay' | 'earthNight' | 'earthClouds' | 'mars' | 'saturn' | 'saturnRing' | 'sun' | 'moon' | 'rock';
export type Payload = { bodies: Body[]; sky: Sky; textures: Record<TextureKey, string> };

export type Textures = Record<TextureKey, THREE.Texture> & { cloudsAlpha: THREE.Texture };

/** What a click or hover resolves to: a body, a moon of one, or the sky behind them. */
export type MoonInfo = Moon & { isMoon: true; parent: Body };
export type Info = Body | MoonInfo | Sky;
export const isMoon = (info: Info): info is MoonInfo => 'isMoon' in info;
export const isBody = (info: Info): info is Body => 'key' in info;

export type LabelSpec = {
  el: HTMLElement;
  target: THREE.Object3D;
  offset: number;
  moonOf?: string;
  /** Measured size in pixels, once; 0 when the stylesheet hides the label. */
  width?: number;
  height?: number;
};

export type World = {
  scene: THREE.Scene;
  anchors: THREE.Group[];
  pickables: THREE.Object3D[];
  labels: LabelSpec[];
  spinners: { obj: THREE.Object3D; speed: number }[];
  /** The drawn orbit lines and the opacity each has at full strength, so the opening move can fade them in. */
  orbitLines: { material: THREE.LineBasicMaterial; opacity: number }[];
};
