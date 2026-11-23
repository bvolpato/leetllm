import { validationScores } from './fixtures.mjs';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const phase = (p, a, z) => clamp((p - a) / (z - a));
export const smooth = (p) => {
  const q = clamp(p);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const cellFor = (v, t) => (v.p >= t ? (v.label ? 'tp' : 'fp') : v.label ? 'fn' : 'tn');
export const cellBox = (key) => ({
  x: key === 'tp' || key === 'fn' ? 210 : 1060,
  y: key === 'tp' || key === 'fp' ? 470 : 710,
  w: 650,
  h: 170,
});
export const cellPosition = (v, t) => {
  const key = cellFor(v, t),
    box = cellBox(key),
    members = validationScores.filter((r) => r.label === v.label),
    j = members.findIndex((r) => r.id === v.id);
  return {
    x: box.x + 100 + j * 140,
    y: box.y + 122,
    key,
  };
};
export function travelPath(points, p) {
  const scaled = clamp(p) * (points.length - 1),
    i = Math.min(points.length - 2, Math.floor(scaled)),
    q = scaled - i;
  return {
    x: mix(points[i].x, points[i + 1].x, q),
    y: mix(points[i].y, points[i + 1].y, q),
  };
}
export const progress = (state, id, beat, a = 0.1, z = 0.85) => {
  const b = state.beat ?? 0;
  if (b < beat) return 0;
  if (b > beat) return 1;
  return state.cues?.[id] ? clamp(state.cues[id].progress) : phase(state.beatP ?? 0, a, z);
};
