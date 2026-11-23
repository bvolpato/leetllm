import { createHash } from 'node:crypto';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export function artifactDigest(bytes) {
  if (typeof bytes !== 'string') throw new TypeError('Artifact fixture needs UTF-8 text bytes');
  return createHash('sha256').update(bytes, 'utf8').digest('hex');
}
export const bound = (value) => Math.max(0, Math.min(1, value));
export const mix = (a, b, p) => a + (b - a) * bound(p);
export function canonicalContent(value) {
  const ordered = (item) =>
    Array.isArray(item)
      ? item.map(ordered)
      : item && typeof item === 'object'
        ? Object.fromEntries(
            Object.entries(item)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, v]) => [key, ordered(v)]),
          )
        : item;
  return JSON.stringify(ordered(value));
}
export function mergeIntervals(intervals) {
  for (const [start, end] of intervals)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start)
      throw new RangeError('Intervals need finite ordered nonnegative endpoints');
  const result = [];
  for (const [start, end] of intervals.map((v) => [...v]).sort((a, b) => a[0] - b[0])) {
    const previous = result.at(-1);
    if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
    else result.push([start, end]);
  }
  return {
    intervals: result,
    duration: result.reduce((sum, [a, b]) => sum + b - a, 0),
  };
}
