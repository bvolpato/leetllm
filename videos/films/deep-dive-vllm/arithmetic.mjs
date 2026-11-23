export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export function reuse(shared, length, block = 4) {
  return Math.floor(Math.min(shared, length - 1) / block) * block;
}
export const vvClamp = (x) => Math.max(0, Math.min(1, x));
export const vvMix = (a, z, p) => a + (z - a) * vvClamp(p);
