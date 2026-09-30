// Capture-line formatting for /sky and the homepage closing photo.
// Exposure values describe one frame. A stacked image says so, and states the
// frame count only when it is recorded.

const trim = (value) => String(Number(value.toFixed(1)));
// A no-break space keeps each number with its unit when the line wraps.
const NBSP = '\u00a0';

export const formatShutter = (seconds) => {
  if (!(seconds > 0)) return null;
  if (seconds >= 1) return `${trim(seconds)}${NBSP}s`;
  return `1/${Math.round(1 / seconds)}${NBSP}s`;
};

export const formatAperture = (f) => (f > 0 ? `f/${trim(f)}` : null);

/** "Stack of 24 × 13 s", "Stacked 13 s frames", or "13 s" for a single exposure. */
export const frameLabel = (shutter, stack) => {
  if (stack === 'unknown') return shutter ? `Stacked ${shutter} frames` : 'Stacked frames';
  if (Number.isInteger(stack) && stack > 1) return shutter ? `Stack of ${stack} × ${shutter}` : `Stack of ${stack} frames`;
  return shutter;
};

/** Short one-line summary: frames · aperture · ISO · focal length. */
export const captureLine = ({ exposure = {}, stack } = {}) => {
  const parts = [
    frameLabel(formatShutter(exposure.seconds), stack),
    formatAperture(exposure.aperture),
    exposure.iso ? `ISO${NBSP}${exposure.iso}` : null,
    exposure.focal_mm ? `${trim(exposure.focal_mm)}${NBSP}mm` : null,
  ];
  return parts.filter(Boolean).join(' · ');
};

/**
 * Newest night first. Photos from the same night keep slug order, so the
 * night's main image keeps the plain `<date>-<place>` slug and single frames
 * add a camera time (`-0030`); the homepage shows the first entry.
 */
export const newestFirst = (a, b) => b.data.date.valueOf() - a.data.date.valueOf() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
