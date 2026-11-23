import { waitTimes } from './fixtures.mjs';
export const quantile = (probability) => {
  const sorted = [...waitTimes].sort((a, b) => a - b),
    position = (sorted.length - 1) * probability;
  const lower = Math.floor(position),
    fraction = position - lower;
  return (
    sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction
  );
};
export function encode(records, heldOut, targetIndex, m = 5) {
  const fitting = records.filter((_, index) => !heldOut.includes(index));
  const prior = fitting.reduce((sum, row) => sum + row.missed, 0) / fitting.length;
  const categoryRows = fitting.filter((row) => row.pool === records[targetIndex].pool);
  return (
    (categoryRows.reduce((sum, row) => sum + row.missed, 0) + m * prior) / (categoryRows.length + m)
  );
}
export const scoreForCap = (cap) => {
  const age = Math.min(200, cap),
    logit = 0.02 * age + 0.01 * 18 - 4;
  return 1 / (1 + Math.exp(-logit));
};
export function heartbeatAge(cutoffMinutes, eventMinutes) {
  return (cutoffMinutes - eventMinutes) / 60;
}
export const clock = (m) =>
  String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
