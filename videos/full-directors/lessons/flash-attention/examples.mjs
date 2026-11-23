import assert from 'node:assert/strict';
import { SCORES, VALUES } from '../../../films/flash-attention/fixtures.mjs';
import {
  attentionBackwardRow,
  attentionInventory,
  cachedBlend,
  causalTileClass,
  finiteAccumulatorExample,
  merge,
  summarize,
  tileInventory,
  tilePipelinePrefix,
} from '../../../films/flash-attention/model.mjs';

export { SCORES, VALUES, tilePipelinePrefix, causalTileClass };
export const giB = 2 ** 30,
  miB = 2 ** 20,
  kiB = 2 ** 10;
export const attention = attentionInventory(8, 32, 8192);
export const tile = tileInventory(64, 96, 32);
export const first = summarize(SCORES.slice(0, 2), VALUES.slice(0, 2));
export const full = summarize(SCORES, VALUES);
export const oldHeight = first.u / first.l;
export const probabilities = SCORES.map((s) => Math.exp(s - full.m) / full.l);
export const lse = full.m + Math.log(full.l);
export const blend = full.u / full.l;
export const resultParts = VALUES.map((v, i) => v * probabilities[i]);
export const inputValues = [3, 9, 15, 100, 100];
export const cacheMasks = Object.fromEntries(
  ['upper-left', 'all', 'absolute'].map((mode) => [mode, cachedBlend(2, inputValues, 3, mode)]),
);
export const gradient = attentionBackwardRow([0, 0], [2, 10], 3);
export const overflow = finiteAccumulatorExample(9e307);
export function maskedSummary(scores, values, allowed) {
  const visible = scores.flatMap((_, i) => (allowed[i] ? [i] : []));
  if (visible.length === 0) return { m: -Infinity, l: 0, u: 0, output: 0 };
  const a = summarize(
    visible.map((i) => scores[i]),
    visible.map((i) => values[i]),
  );
  return { ...a, output: a.u / a.l };
}
export const empty = maskedSummary(SCORES, VALUES, [false, false, false]);
export const single = maskedSummary(SCORES, VALUES, [false, false, true]);
export const scaleCases = [
  [1024, 8192],
  [2048, 16384],
].map(([n, M]) => ({ n, M, d: 64, work: n ** 2 * 64, rows: n, io: (n ** 2 * 64 ** 2) / M }));
export const referencePair = (ref) => {
  const w = [1, 1.3].map((score) => Math.exp(score - ref));
  const mass = w[0] + w[1],
    numerator = w[0] * 10 + w[1] * 20;
  return { w, mass, numerator, mean: numerator / mass };
};
export const signedTiles = [
  { m: 4, l: 2, u: 10 },
  { m: 5, l: 1, u: -3 },
];
export const signedMerge = merge(...signedTiles);
export function oldSignedAt(m) {
  const a = signedTiles[0],
    factor = Math.exp(a.m - m);
  return { m, l: a.l * factor, u: a.u * factor };
}
export function requestTime(progress) {
  const attn = 12 - 6 * progress;
  return { attn, other: 18, total: attn + 18, speed: 30 / (attn + 18) };
}
export function crossings(length) {
  return { space: length ** 2, allowed: (length * (length + 1)) / 2 };
}
export function classifyAligned(tiles) {
  const groups = { past: 0, boundary: 0, future: 0 };
  for (let q = 0; q < tiles; q++)
    for (let k = 0; k < tiles; k++) groups[causalTileClass(2 * q, 2 * q + 1, 2 * k, 2 * k + 1)]++;
  return groups;
}
export function checkExamples() {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, a + ' differs from ' + b);
  assert.deepEqual(
    [crossings(3), crossings(6)],
    [
      { space: 9, allowed: 6 },
      { space: 36, allowed: 21 },
    ],
  );
  assert.deepEqual(
    [attention.score / giB, attention.fourPasses / giB, attention.lse / miB],
    [32, 128, 8],
  );
  assert.deepEqual(
    [tile.q, tile.k, tile.v, tile.o, tile.s, tile.total].map((x) => x / kiB),
    [4, 6, 6, 8, 24, 48],
  );
  close(
    probabilities.reduce((sum, p) => sum + p),
    1,
  );
  close(
    resultParts.reduce((sum, n) => sum + n),
    blend,
  );
  close(Math.exp(SCORES[1] - lse), probabilities[1]);
  close(oldHeight, 17.31058578630005);
  close(merge(first, summarize([3], [40])).u / full.l, blend);
  const held = referencePair(1),
    moved = referencePair(1.3);
  close(held.mean, moved.mean);
  close(moved.numerator, held.numerator * Math.exp(-0.3));
  const converted = oldSignedAt(5),
    incoming = signedTiles[1];
  close(converted.l + incoming.l, signedMerge.l);
  close(converted.u + incoming.u, signedMerge.u);
  assert.equal((signedMerge.u / signedMerge.l).toFixed(6), '0.391065');
  assert.deepEqual(classifyAligned(4), { past: 6, boundary: 4, future: 6 });
  assert.equal(causalTileClass(24, 47, 24, 31), 'boundary');
  assert.deepEqual(
    Object.values(cacheMasks).map((row) => row.output),
    [3, 45.4, 9],
  );
  assert.deepEqual(cacheMasks.absolute.allowed, [true, true, true, false, false]);
  assert.deepEqual(
    [gradient.output, gradient.D, gradient.dp, gradient.ds, gradient.dv],
    [6, 18, [6, 30], [-6, 6], [1.5, 1.5]],
  );
  assert.equal(overflow.accepted, false);
  assert.equal(overflow.normalized, 9e307);
  assert.deepEqual(empty, { m: -Infinity, l: 0, u: 0, output: 0 });
  assert.deepEqual(single, { m: 3, l: 1, u: 40, output: 40 });
  assert.deepEqual(
    ['work', 'rows', 'io'].map((k) => scaleCases[1][k] / scaleCases[0][k]),
    [4, 2, 2],
  );
  assert.ok(scaleCases.every(({ n, M, d }) => d <= M && M <= n * d));
  for (const [steps, a, b] of [
    [3, 'reading', 'free'],
    [4, 'reading', 'copying'],
    [5, 'reading', 'ready'],
    [6, 'free', 'ready'],
    [7, 'free', 'reading'],
    [8, 'copying', 'reading'],
  ]) {
    const { slots } = tilePipelinePrefix(steps);
    assert.deepEqual([slots.A.status, slots.B.status], [a, b]);
  }
  assert.deepEqual(requestTime(1), { attn: 6, other: 18, total: 24, speed: 1.25 });
}
