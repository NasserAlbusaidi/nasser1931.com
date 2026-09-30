// The build-up on /races: the ladder of races by distance, and Mars with one
// moon per race. Pure, so the rules are tested without the race data.
import type { Race } from './races';
// A value import, so it keeps its extension for node --test; the type import above is erased.
import { MAX_MOONS, REST_ELEVATION_DEG } from './orrery.ts';

const DAY = 86400000;
const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Kilometres per leg, from each split's recorded `km`; transitions and legs without one are left out. */
export const legKm = (race: Race) => race.splits.filter(split => split.km && !/^T\d$/i.test(split.leg))
  .map(split => ({ leg: split.leg, km: split.km as number }));

export const kmRaced = (race: Race) => round1(legKm(race).reduce((sum, leg) => sum + leg.km, 0));

export const gapLabel = (count: number) => count < 14
  ? `${count} ${count === 1 ? 'day' : 'days'} later`
  : `${Math.round(count / 7)} weeks later`;

/** Oldest first, one rung per race with a recorded distance, each with the time since the one before. */
export const ladder = (list: Race[]) => list.filter(race => kmRaced(race) > 0)
  .slice().sort((a, b) => a.date.localeCompare(b.date))
  .map((race, index, rungs) => ({ race, km: kmRaced(race), legs: legKm(race),
    gap: index ? gapLabel(days(rungs[index - 1].date, race.date)) : null }));

// Moons sit on ellipses flattened like the orrery's resting view, inside a -100..100 wide box.
export const MARS_RADIUS = 16;
const TILT = Math.sin(REST_ELEVATION_DEG * Math.PI / 180);
// The innermost ellipse's short radius clears Mars, so no moon or orbit line ever crosses the sphere.
export const INNER_ORBIT = MARS_RADIUS / TILT + 6;
export const OUTER_ORBIT = 92;

/**
 * The newest races (as many as the orrery shows), farther out for a longer race on a square-root scale so
 * a 2.5 km swim and a 113 km half both read. Oldest to newest go round the planet, the newest front right.
 */
export const marsMoons = (list: Race[]) => {
  const moons = list.filter(race => kmRaced(race) > 0).slice().sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_MOONS).reverse();
  const roots = moons.map(race => Math.sqrt(kmRaced(race)));
  const low = Math.min(...roots), high = Math.max(...roots);
  return moons.map((race, index) => {
    const rx = high > low ? INNER_ORBIT + (roots[index] - low) / (high - low) * (OUTER_ORBIT - INNER_ORBIT) : (INNER_ORBIT + OUTER_ORBIT) / 2;
    const angle = Math.PI / 4 - (moons.length - 1 - index) * 2 * Math.PI / moons.length;
    const ry = rx * TILT;
    return { name: race.name, date: race.date, km: kmRaced(race), rx, ry, x: rx * Math.cos(angle), y: ry * Math.sin(angle), newest: index === moons.length - 1 };
  });
};
