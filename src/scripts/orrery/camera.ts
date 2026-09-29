import * as THREE from 'three';
import { HOME_DISTANCE, fitView } from '../../lib/orrery';

const FOV = 40;
const EASE = 0.08;
const INTRO_EASE = 0.022;
const PHI_MIN = 0.25;
const PHI_MAX = 1.5;

/** Hand-rolled orbit camera: the exact feel that was approved, which OrbitControls does not reproduce. */
export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
  theta = 0.7;
  phi = 1.1;
  goalPhi = 1.1;
  dist = HOME_DISTANCE;
  goalDist = HOME_DISTANCE;
  ease = EASE;
  dragging = false;
  focus: THREE.Object3D | null = null;
  private homeDist = HOME_DISTANCE;
  private width = 1;
  private height = 1;
  // The sun rests right of centre so text can sit on the left. It is the projection that shifts, not the scene,
  // so dragging and flying in still turn around the sun and the body in focus.
  private restShift = 0;
  private focusShift = 0;
  private shift = 0;
  private shiftApplied = NaN;
  private readonly target = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();

  /**
   * Called on every resize. `safeLeft` is how many pixels of the left side text covers (0 when it does not overlap);
   * the resting distance and the sun's position are fitted to the free area.
   */
  resize(width: number, height: number, extent: number, safeLeft: number) {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    const view = fitView(width, height, FOV, extent, safeLeft);
    this.homeDist = view.dist;
    this.restShift = view.centerX - width / 2;
    // A body in focus is centred in the free area, not under the text.
    this.focusShift = safeLeft > 0 && safeLeft < width ? (safeLeft + width) / 2 - width / 2 : 0;
    if (!this.focus) this.goalDist = this.homeDist;
    this.shift = this.focus ? this.focusShift : this.restShift;
    this.shiftApplied = NaN; // the aspect changed too, so rebuild the projection
    this.applyShift();
  }

  private applyShift() {
    if (Math.abs(this.shift - this.shiftApplied) < 0.01) return;
    this.shiftApplied = this.shift;
    // A negative window offset moves what is drawn to the right.
    this.camera.setViewOffset(this.width, this.height, -this.shift, 0, this.width, this.height);
  }

  /** Start far out and low on the horizon, then rise and settle. */
  beginIntro() {
    this.dist = this.homeDist * 2;
    this.phi = PHI_MAX;
    this.goalPhi = 1.2;
    this.ease = INTRO_EASE;
  }

  /** Where the camera will rest once the move in progress has settled. */
  goalPosition() {
    return new THREE.Vector3(
      this.goalDist * Math.sin(this.goalPhi) * Math.cos(this.theta),
      this.goalDist * Math.cos(this.goalPhi),
      this.goalDist * Math.sin(this.goalPhi) * Math.sin(this.theta),
    );
  }

  fly(to: THREE.Object3D | null, distance: number) {
    this.focus = to;
    this.goalDist = to ? distance : this.homeDist;
    this.ease = EASE;
  }

  release() {
    this.fly(null, 0);
  }

  drag(theta: number, phi: number) {
    this.theta = theta;
    this.phi = this.goalPhi = Math.min(PHI_MAX, Math.max(PHI_MIN, phi));
    this.ease = EASE;
  }

  update() {
    if (this.focus) {
      this.focus.getWorldPosition(this.tmp);
      this.target.lerp(this.tmp, EASE);
    } else this.target.lerp(this.tmp.set(0, 0, 0), EASE);
    this.shift += ((this.focus ? this.focusShift : this.restShift) - this.shift) * EASE;
    this.applyShift();
    this.dist += (this.goalDist - this.dist) * this.ease;
    if (!this.dragging) this.phi += (this.goalPhi - this.phi) * this.ease;
    this.camera.position.set(
      this.target.x + this.dist * Math.sin(this.phi) * Math.cos(this.theta),
      this.target.y + this.dist * Math.cos(this.phi),
      this.target.z + this.dist * Math.sin(this.phi) * Math.sin(this.theta),
    );
    this.camera.lookAt(this.target);
  }
}
