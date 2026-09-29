import * as THREE from 'three';

// The sun sits at the origin, so the light direction is the direction back to it.
const EARTH_VERT = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld;
void main() { vUv = uv; vNormal = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

// Textures arrive decoded to linear, so the result is encoded back for the screen by the colorspace chunk.
const EARTH_FRAG = `uniform sampler2D dayMap; uniform sampler2D nightMap; varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld;
void main() {
  vec3 n = normalize(vNormal); vec3 L = normalize(-vWorld); vec3 V = normalize(cameraPosition - vWorld);
  float ndl = dot(n, L);
  vec3 day = texture2D(dayMap, vUv).rgb * (0.08 + 1.05 * max(ndl, 0.0));
  vec3 night = texture2D(nightMap, vUv).rgb * vec3(1.25, 1.0, 0.75);
  vec3 col = mix(night, day, smoothstep(-0.12, 0.22, ndl));
  float rim = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  col += vec3(0.32, 0.58, 1.0) * rim * clamp(ndl + 0.45, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const HALO_VERT = `varying vec3 vN; void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// Additive glow: the tint is written as-is, so it stays the sRGB colour it was picked as.
const HALO_FRAG = `uniform vec3 tint; uniform float power; varying vec3 vN; void main() { float i = pow(max(0.0, 0.72 - dot(vN, vec3(0.0, 0.0, 1.0))), power); gl_FragColor = vec4(tint, 1.0) * i; }`;

export const earthMaterial = (dayMap: THREE.Texture, nightMap: THREE.Texture) =>
  new THREE.ShaderMaterial({ vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG, uniforms: { dayMap: { value: dayMap }, nightMap: { value: nightMap } } });

export const halo = (radius: number, tint: number, power: number) =>
  new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.ShaderMaterial({
      vertexShader: HALO_VERT,
      fragmentShader: HALO_FRAG,
      uniforms: { tint: { value: new THREE.Color().setHex(tint, THREE.LinearSRGBColorSpace) }, power: { value: power } },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
