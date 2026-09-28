// Book spine colours for the homepage shelf. The spine takes the cover's
// dominant colour, and its text takes whichever ink contrasts more. A mid-tone
// cover can leave both inks under WCAG AA, and the dimmed author and date text
// make it worse, so the spine is shaded away from the ink until the dimmest
// text passes.

export const DARK_INK = '#10151F';
export const LIGHT_INK = '#F4F1EA';
// Lowest opacity any spine text uses (ShelfSpines.astro: .spine-author).
export const DIMMEST_TEXT = 0.75;
export const MIN_CONTRAST = 4.5;
// Spine colours for books without a cached cover.
export const FALLBACK_SPINES = ['#2B3A55', '#5B3A29', '#1F4B43', '#6B2E3A', '#3D3561', '#7A5A1E', '#2F4F6F', '#4A4A3A'];

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/** Mix `a` over `b`, the way the browser composites text at `alpha` opacity. */
export const mix = (a, b, alpha) => {
  const [x, y] = [channels(a), channels(b)];
  return toHex(x.map((c, i) => c * alpha + y[i] * (1 - alpha)));
};

const luminance = (hex) => {
  const [r, g, b] = channels(hex).map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** Contrast of the dimmest spine text against the spine. */
export const dimmestContrast = (spine, ink) => contrast(mix(ink, spine, DIMMEST_TEXT), spine);

export const spineColors = (base) => {
  const ink = contrast(base, DARK_INK) >= contrast(base, LIGHT_INK) ? DARK_INK : LIGHT_INK;
  const away = ink === LIGHT_INK ? '#000000' : '#FFFFFF';
  let spine = base.toUpperCase();
  for (let step = 1; step <= 20 && dimmestContrast(spine, ink) < MIN_CONTRAST; step++) spine = mix(away, base, step * 0.05);
  return { spine, ink };
};
