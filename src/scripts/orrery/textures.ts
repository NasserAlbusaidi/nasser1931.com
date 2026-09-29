import * as THREE from 'three';
import type { TextureKey, Textures } from './types';

// Colour maps are sRGB. The cloud map is also read as alpha, where a colour-space decode would change the curve.
const COLOUR: TextureKey[] = ['earthDay', 'earthNight', 'earthClouds', 'mars', 'saturn', 'saturnRing', 'sun', 'moon', 'rock'];

/** Loads every map. Rejects on the first failed request so the caller can keep the static poster. */
export async function loadTextures(urls: Record<TextureKey, string>, maxAnisotropy: number): Promise<Textures> {
  const loader = new THREE.TextureLoader();
  const keys = Object.keys(urls) as TextureKey[];
  const loaded = await Promise.all(keys.map((key) => loader.loadAsync(urls[key])));
  const textures = Object.fromEntries(keys.map((key, i) => [key, loaded[i]])) as Record<TextureKey, THREE.Texture>;
  for (const key of COLOUR) textures[key].colorSpace = THREE.SRGBColorSpace;
  const cloudsAlpha = textures.earthClouds.clone();
  cloudsAlpha.colorSpace = THREE.NoColorSpace;
  cloudsAlpha.needsUpdate = true;
  textures.earthDay.anisotropy = Math.min(4, maxAnisotropy);
  return { ...textures, cloudsAlpha };
}
