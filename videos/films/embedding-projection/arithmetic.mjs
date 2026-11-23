export const pcaMean = (values) =>
  values.reduce(
    (sum, point) => ({
      x: sum.x + point.x / values.length,
      y: sum.y + point.y / values.length,
    }),
    {
      x: 0,
      y: 0,
    },
  );
export const tsneTerm = (p, q) => p * Math.log(p / q);
export const nearest = (points) =>
  points.map(
    (point, i) =>
      points
        .map((candidate, j) => ({
          j,
          d: Math.hypot(...point.map((coordinate, axis) => coordinate - candidate[axis])),
        }))
        .filter((candidate) => candidate.j !== i)
        .sort((a, b) => a.d - b.d || a.j - b.j)[0].j,
  );
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const between = (seconds, start, end) => clamp01((seconds - start) / (end - start));
export function unitFinite(v) {
  if (!Array.isArray(v) || !v.length || !v.every(Number.isFinite))
    throw Error('Finite nonzero vector required');
  const scale = Math.max(...v.map(Math.abs));
  if (!scale) throw Error('Finite nonzero vector required');
  const scaled = v.map((x) => x / scale),
    norm = Math.hypot(...scaled);
  return scaled.map((x) => x / norm);
}
export function savedCoordinates(v, mu, basis) {
  if (
    v.length !== mu.length ||
    !v.every(Number.isFinite) ||
    !mu.every(Number.isFinite) ||
    !basis.length ||
    !basis.every((r) => r.length === v.length && r.every(Number.isFinite))
  )
    throw Error('Incompatible fitted transform');
  return basis.map((r) => r.reduce((s, x, i) => s + x * (v[i] - mu[i]), 0));
}
export function cauchyMap(points) {
  if (points.length < 2 || !points.every((p) => p.length === 2 && p.every(Number.isFinite)))
    throw Error('Finite two-dimensional map required');
  const weights = points.map((a, i) =>
      points.map((z, j) => (i === j ? 0 : 1 / (1 + a.reduce((s, x, k) => s + (x - z[k]) ** 2, 0)))),
    ),
    denominator = weights.flat().reduce((s, x) => s + x, 0);
  if (!Number.isFinite(denominator) || denominator <= 0)
    throw Error('Map weights require a finite positive normalizer');
  return {
    weights,
    denominator,
    q: weights.map((r) => r.map((x) => x / denominator)),
  };
}
export function mapPairFixture(distance) {
  return cauchyMap([
    [0, 0],
    [distance, 0],
    [0, 1],
    [1, 1],
  ]);
}
export function pairDistanceFor(q) {
  let lo = 0,
    hi = 30;
  if (!Number.isFinite(q) || q < mapPairFixture(hi).q[0][1] || q > mapPairFixture(lo).q[0][1])
    throw Error('Unreachable supplied pair probability');
  for (let n = 0; n < 80; n++) {
    const mid = (lo + hi) / 2;
    if (mapPairFixture(mid).q[0][1] > q) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
