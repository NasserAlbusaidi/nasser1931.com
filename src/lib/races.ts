// Shared race-log helpers for the homepage card and /field#races.
import raceData from '../data/races.json';

export type Split = { leg: string; time: string; seconds: number; km?: number };
export type Race = { date: string; name: string; kind: string; distance: string; status: 'finished' | 'dnf' | 'dns'; total: string | null; note?: string | null; splits: Split[] };

export const races = (raceData.races as Race[]).slice().sort((a, b) => b.date.localeCompare(a.date));
export const raceStatus = { finished: 'Finished', dnf: 'Did not finish', dns: 'Did not start' };

export const toSeconds = (time: string | null) => {
  if (!time) return null;
  return time.split(':').map(Number).reduce((sum, part) => sum * 60 + part, 0);
};
export const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return h ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
};

// Pace in each discipline's own unit, from the leg's course distance.
export const pace = (split: Split) => {
  if (!split.km || !split.seconds) return null;
  const leg = split.leg.toLowerCase();
  if (leg === 'swim') return `${clock(split.seconds / (split.km * 10))} /100m`;
  if (leg === 'bike') return `${(split.km / (split.seconds / 3600)).toFixed(1)} km/h`;
  if (leg === 'run') return `${clock(split.seconds / split.km)} /km`;
  return null;
};

export const transitions = (race: Race) => {
  const legs = race.splits.filter(split => /^T\d$/i.test(split.leg));
  if (!legs.length) return null;
  const seconds = legs.reduce((sum, split) => sum + split.seconds, 0);
  const total = toSeconds(race.total) ?? race.splits.reduce((sum, split) => sum + split.seconds, 0);
  return { seconds, share: total ? seconds / total : 0 };
};

// A PB only means something once a distance has been raced more than once.
export const personalBests = (list: Race[]) => {
  const best = new Map<string, Race>();
  const counts = new Map<string, number>();
  for (const race of list) {
    const time = toSeconds(race.total);
    if (race.status !== 'finished' || time == null) continue;
    counts.set(race.kind, (counts.get(race.kind) ?? 0) + 1);
    const current = best.get(race.kind);
    if (!current || time < (toSeconds(current.total) ?? Infinity)) best.set(race.kind, race);
  }
  return new Set([...best].filter(([kind]) => (counts.get(kind) ?? 0) > 1).map(([, race]) => race));
};

export const raceStats = (list: Race[]) => {
  const finished = list.filter(race => race.status === 'finished');
  const racing = finished.reduce((sum, race) => sum + (toSeconds(race.total) ?? 0), 0);
  const chronological = finished.slice().sort((a, b) => a.date.localeCompare(b.date));
  const firstTri = chronological.find(race => /triathlon/i.test(race.kind));
  const longest = finished.reduce<Race | null>((max, race) => (toSeconds(race.total) ?? 0) > (toSeconds(max?.total ?? null) ?? 0) ? race : max, null);
  const weeks = firstTri && longest && longest !== firstTri && longest.date > firstTri.date
    ? Math.round((Date.parse(longest.date) - Date.parse(firstTri.date)) / (7 * 86400000))
    : null;
  return { entered: list.length, finished: finished.length, racing, firstTri, longest, weeks };
};
