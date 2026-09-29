import * as THREE from 'three';
import { HOME_DISTANCE, REST_PHI, REST_THETA, easeInOut, fitView, type FitOptions, type Reach } from '../../lib/orrery';

export const FOV = 40;
const EASE = 0.08;
const PHI_MIN = 0.25;
const PHI_MAX = 1.5;
// Zoom is a multiplier on the distance the view rests at: 1 is the fitted rest view (or the framing of the body in focus).
export const MAX_ZOOM = 2.5;
// In the overview the camera never comes closer than this: the sun and the inner planets would be on top of it.
const MIN_OVERVIEW_DIST = 12;

type Intro = {
  /** Seconds since the pull-back began; negative while the first frame is being held. */
  t: number;
  duration: number;
  earth: THREE.Object3D;
  startDist: number;
  startShiftX: number;
  startShiftY: number;
};

/** Hand-rolled orbit camera: the exact feel that was approved, which OrbitControls does not reproduce. */
export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
  theta = REST_THETA;
  phi = REST_PHI;
  goalPhi = REST_PHI;
  dist = HOME_DISTANCE;
  goalDist = HOME_DISTANCE;
  ease = EASE;
  dragging = false;
  focus: THREE.Object3D | null = null;
  private intro: Intro | null = null;
  private homeDist = HOME_DISTANCE;
  private focusDist = 0;
  private focusMinDist = 0;
  private zoom = 1;
  private width = 0;
  private height = 0;
  // The sun rests right of centre so text can sit on the left. It is the projection that shifts, not the scene,
  // so dragging and flying in still turn around the sun and the body in focus.
  private restShift = 0;
  private restShiftY = 0;
  private focusShift = 0;
  private shiftX = 0;
  private shiftY = 0;
  private applied = { x: NaN, y: NaN };
  private readonly target = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();

  /** True while a body is in focus or the view is zoomed away from where it rests. */
  get away() {
    return !!this.focus || Math.abs(this.zoom - 1) > 0.01;
  }

  // The distance the current view rests at, before the user's zoom.
  private get baseDist() {
    return this.focus ? this.focusDist : this.homeDist;
  }

  private applyGoal() {
    const min = this.focus ? this.focusMinDist : MIN_OVERVIEW_DIST;
    const max = this.baseDist * MAX_ZOOM;
    this.goalDist = Math.min(max, Math.max(Math.min(min, this.baseDist), this.baseDist * this.zoom));
    this.zoom = this.goalDist / this.baseDist;
  }

  /**
   * Called on every resize. options.safeLeft is how many pixels of the left side text covers (0 when it does not
   * overlap); the resting distance and the sun's position are fitted to the free area. The user's zoom is kept
   * as a share of the new resting distance. A size that has not changed is ignored while the opening move runs,
   * so the observer's first callback cannot cut it short.
   */
  resize(width: number, height: number, reaches: Reach[], options: FitOptions) {
    if (width === this.width && height === this.height && this.intro) return;
    this.cancelIntro();
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    const view = fitView(width, height, FOV, reaches, REST_PHI, options);
    this.homeDist = view.dist;
    this.restShift = view.centerX - width / 2;
    this.restShiftY = view.centerY - height / 2;
    const safeLeft = options.safeLeft ?? 0;
    // A body in focus is centred in the free area, not under the text.
    this.focusShift = safeLeft > 0 && safeLeft < width ? (safeLeft + width) / 2 - width / 2 : 0;
    this.applyGoal();
    this.shiftX = this.focus ? this.focusShift : this.restShift;
    this.shiftY = this.focus ? 0 : this.restShiftY;
    this.applied = { x: NaN, y: NaN }; // the aspect changed too, so rebuild the projection
    this.applyShift();
  }

  private applyShift() {
    if (Math.abs(this.shiftX - this.applied.x) < 0.01 && Math.abs(this.shiftY - this.applied.y) < 0.01) return;
    this.applied = { x: this.shiftX, y: this.shiftY };
    // A negative window offset moves what is drawn to the right and down.
    this.camera.setViewOffset(this.width, this.height, -this.shiftX, -this.shiftY, this.width, this.height);
  }

  /** Unit vector from the camera's target towards the camera at its resting bearing. */
  restDirection() {
    return new THREE.Vector3(
      Math.sin(REST_PHI) * Math.cos(REST_THETA),
      Math.cos(REST_PHI),
      Math.sin(REST_PHI) * Math.sin(REST_THETA),
    );
  }

  /**
   * The opening move. The camera starts close on earth, which is drawn startShiftX/Y pixels from the canvas
   * centre and startDist away, so it can sit exactly over the poster. After hold seconds it pulls back to the
   * resting view over duration seconds, easing in and out.
   */
  beginIntro(earth: THREE.Object3D, startDist: number, startShiftX: number, startShiftY: number, duration: number, hold: number) {
    this.theta = REST_THETA;
    this.phi = this.goalPhi = REST_PHI;
    this.intro = { t: -hold, duration, earth, startDist, startShiftX, startShiftY };
    this.stepIntro(0);
  }

  /** How far through the pull-back it is, from 0 to 1; 1 once it is over or was cut short. */
  get introProgress() {
    return this.intro ? easeInOut(this.intro.t / this.intro.duration) : 1;
  }

  /** A drag, a click, a zoom, or a resize takes over from the opening move, from wherever it had got to. */
  cancelIntro() {
    if (!this.intro) return;
    this.intro = null;
    this.ease = EASE;
    this.applyGoal();
  }

  /** Fly in on an object, resting distance from it (never closer than minDistance when zooming). */
  fly(to: THREE.Object3D, distance: number, minDistance: number) {
    this.cancelIntro();
    this.focus = to;
    this.focusDist = distance;
    this.focusMinDist = minDistance;
    this.zoom = 1;
    this.applyGoal();
    this.ease = EASE;
  }

  /** Back to the whole system at the fitted rest distance, zoom reset. */
  overview() {
    this.cancelIntro();
    this.focus = null;
    this.zoom = 1;
    this.applyGoal();
    this.ease = EASE;
  }

  /** Multiplies the zoom: below 1 comes closer. It is clamped, and the camera eases to the new distance. */
  zoomBy(factor: number) {
    this.setZoom(this.zoom * factor);
  }

  setZoom(zoom: number) {
    this.cancelIntro();
    this.zoom = zoom;
    this.applyGoal();
    this.ease = EASE;
  }

  get zoomLevel() {
    return this.zoom;
  }

  drag(theta: number, phi: number) {
    this.cancelIntro();
    this.theta = theta;
    this.phi = this.goalPhi = Math.min(PHI_MAX, Math.max(PHI_MIN, phi));
    this.ease = EASE;
  }

  private stepIntro(dt: number) {
    const intro = this.intro!;
    intro.t += dt;
    const s = easeInOut(intro.t / intro.duration);
    intro.earth.getWorldPosition(this.tmp);
    this.target.copy(this.tmp).multiplyScalar(1 - s);
    // Distance changes by a ratio, so it is eased in log space to feel even.
    this.dist = Math.exp(Math.log(intro.startDist) + (Math.log(this.homeDist) - Math.log(intro.startDist)) * s);
    this.shiftX = intro.startShiftX + (this.restShift - intro.startShiftX) * s;
    this.shiftY = intro.startShiftY + (this.restShiftY - intro.startShiftY) * s;
    if (intro.t >= intro.duration) {
      this.intro = null;
      this.applyGoal();
    }
  }

  update(dt = 0) {
    if (this.intro) this.stepIntro(dt);
    else {
      if (this.focus) {
        this.focus.getWorldPosition(this.tmp);
        this.target.lerp(this.tmp, EASE);
      } else this.target.lerp(this.tmp.set(0, 0, 0), EASE);
      this.shiftX += ((this.focus ? this.focusShift : this.restShift) - this.shiftX) * EASE;
      this.shiftY += ((this.focus ? 0 : this.restShiftY) - this.shiftY) * EASE;
      this.dist += (this.goalDist - this.dist) * this.ease;
      if (!this.dragging) this.phi += (this.goalPhi - this.phi) * this.ease;
    }
    this.applyShift();
    this.camera.position.set(
      this.target.x + this.dist * Math.sin(this.phi) * Math.cos(this.theta),
      this.target.y + this.dist * Math.cos(this.phi),
      this.target.z + this.dist * Math.sin(this.phi) * Math.sin(this.theta),
    );
    this.camera.lookAt(this.target);
  }
}
