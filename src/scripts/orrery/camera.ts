import * as THREE from 'three';
import { HOME_DISTANCE, fitDistance } from '../../lib/orrery';

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
  private readonly target = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();

  /** Called on every resize: the resting distance depends on the canvas shape. */
  resize(aspect: number, extent: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.homeDist = fitDistance(aspect, FOV, extent);
    if (!this.focus) this.goalDist = this.homeDist;
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
