export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const prefix = (xs) => xs.reduce((out, v) => [...out, out.at(-1) + v], [0]);
export function merge(a, ba, z, bz) {
  const m = Math.max(ba, bz),
    wa = 2 ** (ba - m),
    wz = 2 ** (bz - m),
    total = wa + wz;
  const weights = [wa / total, wz / total];
  return {
    weights,
    output: a.map((v, i) => weights[0] * v + weights[1] * z[i]),
    b: m + Math.log2(total),
  };
}
export const clip = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, z, p) => a + (z - a) * clip(p);
export const part = (p, a, z) => clip((p - a) / (z - a));
export function mergeReference(a, ba, z, bz) {
  if (
    !Array.isArray(a) ||
    !Array.isArray(z) ||
    a.length === 0 ||
    a.length !== z.length ||
    !a.every(Number.isFinite) ||
    !z.every(Number.isFinite) ||
    ![ba, bz].every((b) => Number.isFinite(b) || b === -Infinity)
  )
    throw new RangeError('invalid merge state');
  if ((ba === -Infinity && a.some((v) => v !== 0)) || (bz === -Infinity && z.some((v) => v !== 0)))
    throw new RangeError('empty state must have zero output');
  if (ba === -Infinity)
    return {
      output: [...z],
      b: bz,
    };
  if (bz === -Infinity)
    return {
      output: [...a],
      b: ba,
    };
  return merge(a, ba, z, bz);
}
