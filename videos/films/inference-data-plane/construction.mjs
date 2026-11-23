export function payloadProduct(beat, progress) {
  const factors = [2, 4, 128, 2, 8, 2],
    phase = (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a)));
  const visible = beat === 0 ? Math.floor(6 * phase(progress, 0.05, 0.9)) : 6,
    count = beat === 0 ? 0 : beat === 1 ? Math.floor(6 * phase(progress, 0.05, 0.45)) : 6;
  return {
    factors,
    visible,
    count,
    product: count ? factors.slice(0, count).reduce((a, v) => a * v, 1) : null,
    previous: count > 1 ? factors.slice(0, count - 1).reduce((a, v) => a * v, 1) : 1,
    complete: count === 6,
  };
}
export function lifecycleSnapshot(beat, progress) {
  const thresholds =
    beat === 0
      ? [0, 0.18, 0.32, 0.58, 0.82, Infinity, Infinity]
      : beat === 1
        ? [0, 0, 0, 0, 0, 0.28, 0.7]
        : [0, 0, 0, 0, 0, 0, 0];
  const completed = thresholds.map((threshold) => progress >= threshold);
  return {
    completed,
    current: completed.lastIndexOf(true),
    request: 'R4219',
    operation: 'op-17',
    model: 'M17/r5',
    buffer: 'KV-48',
  };
}
