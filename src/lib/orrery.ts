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
const FIT_MARGIN = 1.04;
// The orbits are seen from about 21 degrees above their plane, so the system is much flatter than it is wide.
const VERTICAL_SHARE = 0.6;
// Where the sun may sit, as a share of the canvas width, when text takes the left side.
const SUN_MIN = 0.6;
const SUN_MAX = 0.75;
// Breathing room between the outermost ring and the edge of the free area (text side or canvas edge).
const PAD_TEXT_PX = 24;
const PAD_PLAIN_PX = 12;

export type View = { dist: number; centerX: number };

/**
 * Camera distance and the sun's horizontal position for a `w` x `h` canvas, so everything out to
 * `extent` (Saturn's ring included) stays inside the free area and is never clipped.
 * `safeLeft` is the width, in pixels, that text covers on the left; the sun is centred in what is left
 * (between 60% and 75% of the width). With no text (`safeLeft` 0) the sun stays centred and the narrower
 * canvas side decides the distance, as on a phone. Never closer than `minDist`.
 */
export const fitView = (w: number, h: number, fovDeg: number, extent: number, safeLeft = 0, minDist = HOME_DISTANCE): View => {
  if (!(w > 0) || !(h > 0) || !(extent > 0)) return { dist: minDist, centerX: w > 0 ? w / 2 : 0 };
  const tan = Math.tan((fovDeg * Math.PI) / 360);
  let centerX = w / 2;
  let half = Math.min(w, h) / 2 - PAD_PLAIN_PX;
  if (safeLeft > 0 && safeLeft < w) {
    centerX = Math.min(SUN_MAX * w, Math.max(SUN_MIN * w, (safeLeft + w) / 2));
    half = Math.min(centerX - safeLeft, w - centerX) - PAD_TEXT_PX;
  }
  const needed = extent * FIT_MARGIN;
  const across = half > 0 ? (needed * (h / 2)) / (half * tan) : Infinity;
  const up = (needed * VERTICAL_SHARE) / tan;
  return { dist: Math.max(minDist, across, up), centerX };
};
