// Pure rules behind the homepage solar system: what each section becomes, how big
// it is, and how fast it orbits. No imports, so `node --test` can load it as is.
// Size follows how much is in a section; speed follows how recently it changed.

export type Moon = { name: string; note: string };
export type RaceRow = { name: string; date: string; status: 'finished' | 'dnf' | 'dns' };
export type OrreryInput = {
  projects: { count: number; changed: string | null; moons: Moon[] };
  races: RaceRow[]; // newest first
  notes: { count: number; changed: string | null };
  reading: {
    count: number;
    changed: string | null;
    current: { title: string; progress: number | null } | null;
    series: { name: string; done: number; total: number } | null;
  };
  sky: { count: number; changed: string | null; latestTitle: string | null };
};
export type Body = {
  key: 'sun' | 'earth' | 'mars' | 'notes' | 'saturn';
  kind: 'sun' | 'planet' | 'rock';
  name: string;
  section: string;
  href: string;
  radius: number;
  orbit: number;
  phase: number;
  changed: string | null;
  stats: string[];
  why: string;
  moons: Moon[];
  ring: { name: string; done: number; total: number } | null;
};
export type Sky = { name: string; section: string; href: string; changed: string | null; stats: string[]; why: string };

const DAY_MS = 864e5;
// A source with no date is not given a fake one; it drifts at the speed of a section untouched for this long.
export const UNDATED_DAYS = 90;
export const ROCK_RADIUS = 0.2;
export const SUN_RADIUS = 1.05;
// A crowded race log would turn Mars into a swarm; the newest few tell the story.
export const MAX_MOONS = 6;

export const bodySize = (count: number) => 0.28 + 0.13 * Math.sqrt(Math.max(0, count));
// Fast when fresh, settling to a slow drift after a couple of months.
export const orbitSpeed = (days: number) => 0.32 * (0.14 + 0.86 * Math.exp(-Math.max(0, days) / 45));

export const daysSince = (iso: string | null, now: number): number | null => {
  if (!iso) return null;
  const time = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isFinite(time) ? Math.max(0, Math.round((now - time) / DAY_MS)) : null;
};

/** `days` stays null for an undated source; `speed` then uses UNDATED_DAYS. */
export const motion = (changed: string | null, now: number) => {
  const days = daysSince(changed, now);
  return { days, speed: orbitSpeed(days ?? UNDATED_DAYS) };
};

export const agoLabel = (days: number) =>
  days === 0 ? 'today' : days === 1 ? 'yesterday' : days < 60 ? `${days} days ago` : `${Math.round(days / 30)} months ago`;

const shortDate = (iso: string) => {
  const parsed = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed)
    : iso;
};
const statusLabel = { finished: 'finished', dnf: 'did not finish', dns: 'did not start' };
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
// Only full dates count: a year or month alone would read as an invented day.
export const latestDate = (dates: (string | null)[]) =>
  dates.filter((date): date is string => !!date && /^\d{4}-\d{2}-\d{2}/.test(date)).sort().at(-1) ?? null;

export const buildOrrery = (input: OrreryInput): { bodies: Body[]; sky: Sky } => {
  const { projects, races, notes, reading, sky } = input;
  const ring = reading.series;
  const ringNote = ring ? ` The ring traces ${ring.name}: ${ring.total} segments, ${Math.floor(ring.done)} read.` : '';
  const bodies: Body[] = [
    { key: 'sun', kind: 'sun', name: 'The Sun', section: 'Home', href: '/', radius: SUN_RADIUS, orbit: 0, phase: 0, changed: null,
      stats: ['Senior software engineer, Muscat', 'Everything else orbits this'], why: 'The centre of the page. Everything else here is something I work on or care about.', moons: [], ring: null },
    { key: 'earth', kind: 'planet', name: 'Earth', section: 'Projects', href: '/builds', radius: bodySize(projects.count), orbit: 3.4, phase: 0.6, changed: projects.changed,
      stats: [plural(projects.count, 'project')], why: 'Home base, where I make things. Featured projects are its moons.', moons: projects.moons, ring: null },
    { key: 'mars', kind: 'planet', name: 'Mars', section: 'Races', href: '/races', radius: bodySize(races.length), orbit: 5.0, phase: 2.5, changed: races[0]?.date ?? null,
      stats: [plural(races.length, 'race')], why: 'The red planet I train to reach. Each race is a moon.',
      moons: races.slice(0, MAX_MOONS).map((race) => ({ name: race.name, note: `${shortDate(race.date)} · ${statusLabel[race.status]}` })), ring: null },
    { key: 'notes', kind: 'rock', name: 'Asteroid belt', section: 'Notes', href: '/stupidshit', radius: ROCK_RADIUS, orbit: 6.6, phase: 4.2, changed: notes.changed,
      stats: [plural(notes.count, 'note')], why: 'Short pieces, written when something sparks. They drift between racing and reading.', moons: [], ring: null },
    { key: 'saturn', kind: 'planet', name: 'Saturn', section: 'Reading', href: '/reading', radius: bodySize(reading.count), orbit: 8.7, phase: 5.3, changed: reading.changed,
      stats: [plural(reading.count, 'book'), ...(reading.current ? [`Reading: ${reading.current.title}${reading.current.progress == null ? '' : ` · ${Math.round(reading.current.progress)}%`}`] : [])],
      why: `Slow, big, and it has rings.${ringNote}`, moons: [], ring },
  ];
  return {
    bodies,
    sky: { name: 'The stars', section: 'Sky', href: '/sky', changed: sky.changed,
      stats: [plural(sky.count, 'photo'), ...(sky.latestTitle ? [`Latest: ${sky.latestTitle}`] : [])],
      why: 'The sky is the backdrop, and my own night photos live at the other end of this link.' },
  };
};

export const HOME_DISTANCE = 30;
// The resting camera: a fixed bearing, seen from 30 degrees above the orbital plane. Steeper than the 21 it used to
// be, so the system is a rounder ellipse that fills more of the hero's height instead of a thin one.
export const REST_ELEVATION_DEG = 30;
export const REST_THETA = 0.7;
export const REST_PHI = Math.PI / 2 - (REST_ELEVATION_DEG * Math.PI) / 180;

// Where the sun may sit, as a share of the canvas width, when text takes the left side.
const SUN_MIN = 0.6;
const SUN_MAX = 0.75;
// Breathing room between the outermost ring and the canvas edge, and above and below the system.
const EDGE_PAD_PX = 16;
const PLAIN_PAD_PX = 12;
const MIN_DIST = 10;
const MAX_DIST = 400;
const ORBIT_SAMPLES = 96;

/** How far a body, its ring, or its moons reach out from its own centre, in scene units. */
export const bodyReach = (body: Pick<Body, 'kind' | 'radius' | 'ring' | 'moons'>) => {
  if (body.kind === 'sun') return body.radius * 1.4;
  if (body.ring) return body.radius * 2.5;
  if (body.moons.length) return body.radius + 0.45 + (body.moons.length - 1) * 0.26 + 0.14;
  return body.radius * 1.3;
};

export type Reach = { orbit: number; reach: number };
export const systemReaches = (bodies: Pick<Body, 'kind' | 'radius' | 'ring' | 'moons' | 'orbit'>[]): Reach[] =>
  bodies.map((body) => ({ orbit: body.orbit, reach: bodyReach(body) }));

export type Bounds = { left: number; right: number; top: number; bottom: number };

/**
 * Where the system lands on a canvas `h` pixels tall, as pixel offsets from the sun's screen position
 * (x right, y down), for a camera `dist` away at polar angle `phi`. Every orbit is sampled all the way round,
 * so a body is counted wherever it might be, near side, far side, or at the sides, with perspective.
 * The bearing does not matter: the orbits are circles.
 */
export const projectBounds = (reaches: Reach[], dist: number, fovDeg: number, h: number, phi = REST_PHI): Bounds => {
  const k = h / 2 / Math.tan((fovDeg * Math.PI) / 360);
  const bounds = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  for (const { orbit, reach } of reaches) {
    for (let i = 0; i < (orbit > 0 ? ORBIT_SAMPLES : 1); i++) {
      const a = (i / ORBIT_SAMPLES) * Math.PI * 2;
      const depth = dist - orbit * Math.cos(a) * Math.sin(phi);
      const x = (-orbit * Math.sin(a) * k) / depth;
      const y = (orbit * Math.cos(a) * Math.cos(phi) * k) / depth;
      const r = (reach * k) / depth;
      bounds.left = Math.min(bounds.left, x - r);
      bounds.right = Math.max(bounds.right, x + r);
      bounds.top = Math.min(bounds.top, y - r);
      bounds.bottom = Math.max(bounds.bottom, y + r);
    }
  }
  return bounds;
};

export type View = { dist: number; centerX: number; centerY: number };
export type FitOptions = {
  /** Pixels on the left that text covers, gap included; 0 when nothing overlaps. */
  safeLeft?: number;
  /** Room a label needs under the lowest body. */
  labelBelowPx?: number;
  /** Room to keep clear at the bottom (a caption band, say). */
  padBottomPx?: number;
};

/**
 * The closest camera distance, and the sun's horizontal position, at which the whole system stays
 * inside a `w` x `h` canvas at the resting pose: Saturn and its ring, moons, and labels included, wherever they
 * are on their orbits. With text on the left, the sun is centred in the free area (60% to 75% across); without it,
 * the sun is centred on the canvas. Only the resting view is fitted: a drag may clip it for a moment.
 */
export const fitView = (w: number, h: number, fovDeg: number, reaches: Reach[], phi = REST_PHI, options: FitOptions = {}): View => {
  const { safeLeft = 0, labelBelowPx = 0, padBottomPx = PLAIN_PAD_PX } = options;
  if (!(w > 0) || !(h > 0) || !reaches.length) return { dist: HOME_DISTANCE, centerX: w > 0 ? w / 2 : 0, centerY: h > 0 ? h / 2 : 0 };
  const beside = safeLeft > 0 && safeLeft < w;
  const left = beside ? safeLeft : PLAIN_PAD_PX;
  const right = w - (beside ? EDGE_PAD_PX : PLAIN_PAD_PX);
  const centerX = beside ? Math.min(SUN_MAX * w, Math.max(SUN_MIN * w, (left + right) / 2)) : w / 2;
  const half = Math.min(centerX - left, right - centerX);
  // The system is much lower than it is high above the sun (the near side and its labels hang down), so it is
  // centred vertically by its own bounds, not by the sun.
  const room = h - PLAIN_PAD_PX - padBottomPx;
  const centerYFor = (dist: number) => {
    const b = projectBounds(reaches, dist, fovDeg, h, phi);
    const up = -b.top;
    const down = b.bottom + labelBelowPx;
    return { fits: Math.max(-b.left, b.right) <= half && up + down <= room, centerY: PLAIN_PAD_PX + up + (room - up - down) / 2 };
  };
  const fits = (dist: number) => centerYFor(dist).fits;
  if (!(half > 0)) return { dist: MAX_DIST, centerX, centerY: h / 2 };
  if (fits(MIN_DIST)) return { dist: MIN_DIST, centerX, centerY: centerYFor(MIN_DIST).centerY };
  let near = MIN_DIST;
  let far = MAX_DIST;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (fits(mid)) far = mid;
    else near = mid;
  }
  return { dist: far, centerX, centerY: centerYFor(far).centerY };
};

export type FocusOptions = FitOptions & {
  /** The open card's top-left corner on the canvas, when it is laid over it (wide screens); null when it is not. */
  card?: { left: number; top: number } | null;
};
export type FocusPlace = {
  /** How far the body's centre sits right of and below the canvas centre, in pixels. */
  shiftX: number;
  shiftY: number;
  /** The widest the body may be drawn so it and its label stay in the room; Infinity when nothing limits it. */
  maxDiameter: number;
};

// Space kept between the card and a focused body's label, and how much of the room the body may use.
const CARD_GAP_PX = 24;
const FOCUS_ROOM = 0.92;
// Beside the card wins unless above it has clearly more room, so a body does not jump between the two as the card's height changes.
const BESIDE_PREFERENCE = 0.85;

/**
 * Where a body in focus goes. Without a card over the canvas it is centred in the free area (right of the copy).
 * With one, the body and the label under it go to its left, at the same height as before, or above it when that
 * has clearly more room. `maxDiameter` is what fits there, so a narrow window draws the body smaller instead of
 * under the card.
 */
export const focusPlace = (w: number, h: number, options: FocusOptions = {}): FocusPlace => {
  const { safeLeft = 0, labelBelowPx = 0, padBottomPx = PLAIN_PAD_PX, card = null } = options;
  const beside = safeLeft > 0 && safeLeft < w;
  if (!card) return { shiftX: beside ? (safeLeft + w) / 2 - w / 2 : 0, shiftY: 0, maxDiameter: Infinity };
  const left = beside ? safeLeft : PLAIN_PAD_PX;
  const top = PLAIN_PAD_PX;
  const bottom = h - padBottomPx;
  const room = (right: number, lowest: number) => Math.max(0, Math.min(right - left, lowest - top - labelBelowPx)) * FOCUS_ROOM;
  const toLeft = room(card.left - CARD_GAP_PX, bottom);
  const above = room(w - EDGE_PAD_PX, card.top - CARD_GAP_PX);
  if (toLeft >= above * BESIDE_PREFERENCE) {
    const half = toLeft / 2;
    const centerY = Math.min(bottom - labelBelowPx - half, Math.max(top + half, h / 2));
    return { shiftX: (left + card.left - CARD_GAP_PX) / 2 - w / 2, shiftY: centerY - h / 2, maxDiameter: toLeft };
  }
  return { shiftX: (left + w - EDGE_PAD_PX) / 2 - w / 2, shiftY: (top + card.top - CARD_GAP_PX - labelBelowPx) / 2 - h / 2, maxDiameter: above };
};

/** Smooth start and finish. `t` is clamped to 0..1. */
export const easeInOut = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * How far a camera must be from a sphere of scene radius `radius`, looking straight at it, for the sphere
 * to be `pxRadius` pixels in radius on a canvas `h` pixels tall.
 */
export const sphereDistance = (pxRadius: number, h: number, fovDeg: number, radius: number) => {
  const tanHalfAngle = (pxRadius * Math.tan((fovDeg * Math.PI) / 360)) / (h / 2);
  return radius / Math.sin(Math.atan(tanHalfAngle));
};

/**
 * Earth's orbit angle that puts the sun `offset` radians to the right of a camera at bearing `theta`, as seen
 * from Earth. The camera then sees a mostly lit disc with the terminator on its left, and the sun stays out of frame.
 */
export const earthStartAngle = (theta: number, offset: number, orbit = 3.4) => {
  const toCamera = [Math.cos(theta), Math.sin(theta)];
  const right = [Math.sin(theta), -Math.cos(theta)];
  const toSun = [Math.cos(offset) * toCamera[0] + Math.sin(offset) * right[0], Math.cos(offset) * toCamera[1] + Math.sin(offset) * right[1]];
  return Math.atan2(-toSun[1] * orbit, -toSun[0] * orbit);
};
