import { EMBED } from './fixtures.mjs';
import { dotProduct, stableSoftmax } from 'vizmatic';
export const position = (i) => [0.05 * i, 0, 0, 0.05 * i];
export const positionIds = (ids) => ids.map((id, i) => EMBED[id].map((v, j) => v + position(i)[j]));
export const sum = (values) => values.reduce((a, v) => a + v, 0);
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export const lerpRow = (a, b, p) => a.map((v, i) => v + (b[i] - v) * p);
export function normStats(row) {
  const mean = sum(row) / row.length,
    centered = row.map((v) => v - mean);
  const variance = sum(centered.map((v) => v * v)) / row.length,
    scale = Math.sqrt(variance + 1e-5);
  return {
    mean,
    centered,
    variance,
    scale,
    normalized: centered.map((v) => v / scale),
  };
}
export const norm = (row) => normStats(row).normalized;
export const project = (row, weights) =>
  weights[0].map((_, j) => sum(row.map((v, i) => v * weights[i][j])));
export const cue = (state, id, a = 0.15, b = 0.7) =>
  state.cues?.[id] ? smooth(state.cues[id].progress) : smooth(((state.beatP ?? 0) - a) / (b - a));
export const event = (state, beat, id, a, b) =>
  (state.beat ?? 0) < beat ? 0 : state.beat > beat ? 1 : cue(state, id, a, b);
export const done = (p) => p >= 1 - 1e-9;
export const slice14 = (row) => [row[0], row[3]];
export function unmaskedRead(rows) {
  return rows.map((q) => {
    const w = stableSoftmax(rows.map((k) => dotProduct(q, k) / Math.sqrt(rows[0].length)));
    return q.map((_, j) => sum(rows.map((r, i) => w[i] * r[j])));
  });
}
export function splitHeads(rows) {
  return Array.from(
    {
      length: 3,
    },
    (_, h) => rows.map((r) => r.slice(h * 2, h * 2 + 2)),
  );
}
export function mergeHeads(heads) {
  return heads[0].map((_, t) => heads.flatMap((h) => h[t]));
}
