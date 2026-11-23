import assert from 'node:assert/strict';
const Q = [
  [1, 0.5],
  [0.5, 1],
];
const K = [
  [0.8, 0.2],
  [0.3, 0.9],
];
const V = [
  [2, 1],
  [1, 2],
];
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const softmax = (row) => {
  const peak = Math.max(...row),
    exps = row.map((x) => Math.exp(x - peak)),
    total = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / total);
};
const blendOf = (shares, values) =>
  [0, 1].map((c) => shares[0] * values[0][c] + shares[1] * values[1][c]);
/** A row vector times a matrix: how a token state projects into a query, key, or value. */
const project = (state, W) => [0, 1].map((c) => state[0] * W[0][c] + state[1] * W[1][c]);
const SCORES = Q.map((q) => K.map((k) => dot(q, k)));
const ROOT = Math.sqrt(2);
const SCALED = SCORES.map((row) => row.map((x) => x / ROOT));
const WEIGHTS = SCALED.map(softmax);
const OUTPUT = WEIGHTS.map((row) => blendOf(row, V));
const close = (a, b, tolerance = 0.005) => assert(Math.abs(a - b) < tolerance, `${a} is not ${b}`);
close(SCORES[1][0], 0.6);
close(SCORES[1][1], 1.05);
close(SCORES[0][1], 0.75);
close(SCALED[1][0], 0.424);
close(SCALED[1][1], 0.742);
close(WEIGHTS[1][0], 0.421);
close(WEIGHTS[1][1], 0.579);
close(OUTPUT[1][0], 1.421);
close(OUTPUT[1][1], 1.579);
close(OUTPUT[0][0], 1.527);
close(OUTPUT[0][1], 1.473);
close(WEIGHTS[0][0], 0.53);
close(WEIGHTS[0][1], 0.47);
assert.deepEqual(project([1, 0], Q), Q[0]);
assert.deepEqual(project([0, 1], Q), Q[1]);
assert.deepEqual(project([0, 1], K), K[1]);
assert.deepEqual(project([0, 1], V), V[1]);
const COLUMN_SUMS = [0, 1].map((c) => WEIGHTS[0][c] + WEIGHTS[1][c]);
close(COLUMN_SUMS[0], 0.95);
close(COLUMN_SUMS[1], 1.05);
// A longer key can beat a shorter key that points the same way as the query.
const SHORT_KEY = [0.3, 0.6],
  LONG_KEY = [1.1, 0.4];
const angleTo = (a, b) => Math.acos(dot(a, b) / Math.hypot(...a) / Math.hypot(...b));
assert(angleTo(Q[1], SHORT_KEY) < angleTo(Q[1], LONG_KEY));
assert(Math.hypot(...LONG_KEY) > Math.hypot(...SHORT_KEY));
assert(dot(Q[1], LONG_KEY) > dot(Q[1], SHORT_KEY));
close(dot(Q[1], SHORT_KEY), 0.75);
close(dot(Q[1], LONG_KEY), 0.95);
// Softmax by hand for the sing row.
const EXPS = SCALED[1].map(Math.exp);
close(EXPS[0], 1.53);
close(EXPS[0] + EXPS[1], 3.63);
close(EXPS[0] / (EXPS[0] + EXPS[1]), WEIGHTS[1][0]);
// Attention dropout at p = 0.5 can drop the birds share and double the sing share.
const DROPPED_SHARE = WEIGHTS[1][1] / 0.5;
close(DROPPED_SHARE, 1.16);
const DROPPED_OUTPUT = V[1].map((x) => x * DROPPED_SHARE);
// The second head of the two-head example. These matrices are invented for it.
const HEAD2 = {
  q: [1, 0],
  K: [
    [1, 0],
    [0, 1],
  ],
  V: [
    [0, 1],
    [1, 0],
  ],
};
const HEAD2_SCORES = HEAD2.K.map((k) => dot(HEAD2.q, k));
const HEAD2_WEIGHTS = softmax(HEAD2_SCORES.map((x) => x / ROOT));
const HEAD2_OUTPUT = blendOf(HEAD2_WEIGHTS, HEAD2.V);
close(HEAD2_WEIGHTS[0], 0.67);
close(HEAD2_WEIGHTS[1], 0.33);
close(HEAD2_OUTPUT[0], 0.33);
close(HEAD2_OUTPUT[1], 0.67);
// Why divide by the square root of the width.
const UNSCALED_WEIGHTS = softmax(SCORES[1]);
close(UNSCALED_WEIGHTS[0], 0.39);
close(UNSCALED_WEIGHTS[1], 0.61);
assert.equal(Math.sqrt(64), 8);
close(Math.sqrt(512), 22.63);
close(Math.exp(10), 22026, 1);
const shareSlope = (scores) => {
  const a = softmax(scores)[0];
  return a * (1 - a);
};
const TIED_SLOPE = shareSlope([0, 0, 0]),
  LEAD_SLOPE = shareSlope([20, 0, 0]);
close(TIED_SLOPE, 0.22);
assert(LEAD_SLOPE > 4e-9 && LEAD_SLOPE < 4.2e-9);
const GAP_SHARES = softmax([2, 1, 0]);
softmax([1002, 1001, 1000]).forEach((share, i) => close(share, GAP_SHARES[i], 1e-9));
// The pull on the output: a_j (v_j - o), for the sing row.
const BIRDS_PULL = [0, 1].map((c) => WEIGHTS[1][0] * (V[0][c] - OUTPUT[1][c]));
close(BIRDS_PULL[0], 0.24);
close(BIRDS_PULL[1], -0.24);
// The cost of stored scores, and the cache sizes for a hypothetical layout.
const SCORE_BYTES = 8 * 32 * 8192 ** 2 * 2;
close(SCORE_BYTES / 1e9, 34.36);
const cacheBytes = (kvHeads) => 2 * 80 * kvHeads * 128 * 8192 * 16 * 2;
assert.equal(Math.round(cacheBytes(64) / 1e9), 344);
assert.equal(Math.round(cacheBytes(8) / 1e9), 43);
assert.equal(Math.round(cacheBytes(1) / 1e9), 5);
assert.equal(4 * 4, 16);
assert.equal(8 * 8, 64);
assert.equal(8 * 64, 512);
// Overflow. JavaScript numbers are the standard 64-bit floats.
assert.equal(Math.exp(1000), Infinity);
const STABLE_SHARES = softmax([1000, 1001, 999]);
assert.deepEqual(
  STABLE_SHARES.map((x) => Math.round(x * 100)),
  [24, 67, 9],
);
const FP16_MAX = 65504;
assert(300 * 300 > FP16_MAX);
// Online softmax across two tiles, checked against the full row.
const onlineSoftmax = (tiles) => {
  let peak = -Infinity,
    sum = 0,
    weighted = 0;
  const steps = [];
  for (const { scores, values } of tiles) {
    const next = Math.max(peak, ...scores),
      rescale = Math.exp(peak - next);
    sum =
      (Number.isFinite(peak) ? sum * rescale : 0) +
      scores.reduce((total, x) => total + Math.exp(x - next), 0);
    weighted =
      (Number.isFinite(peak) ? weighted * rescale : 0) +
      scores.reduce((total, x, i) => total + Math.exp(x - next) * values[i], 0);
    peak = next;
    steps.push({
      peak,
      sum,
      weighted,
      rescale,
    });
  }
  return {
    steps,
    output: weighted / sum,
  };
};
const TRACE = onlineSoftmax([
  {
    scores: [1000],
    values: [2],
  },
  {
    scores: [1001, 999],
    values: [1, 4],
  },
]);
close(TRACE.steps[0].sum, 1);
close(TRACE.steps[0].weighted, 2);
close(TRACE.steps[1].sum, 1.503);
close(TRACE.steps[1].weighted, 2.277);
close(TRACE.output, STABLE_SHARES[0] * 2 + STABLE_SHARES[1] * 1 + STABLE_SHARES[2] * 4, 1e-9);
assert.equal(TRACE.output.toFixed(2), '1.51');
// Your turn: a new state, the same matrices.
const NEW_STATE = [1, 3];
const NEW_QUERY = project(NEW_STATE, Q);
const NEW_SCORES = K.map((k) => dot(NEW_QUERY, k));
const NEW_WEIGHTS = softmax(NEW_SCORES.map((x) => x / ROOT));
const NEW_OUTPUT = blendOf(NEW_WEIGHTS, V);
close(NEW_QUERY[0], 2.5);
close(NEW_QUERY[1], 3.5);
close(NEW_SCORES[0], 2.7);
close(NEW_SCORES[1], 3.9);
close(NEW_WEIGHTS[0], 0.3);
close(NEW_WEIGHTS[1], 0.7);
close(NEW_OUTPUT[0], 1.3);
close(NEW_OUTPUT[1], 1.7);

export {
  Q,
  K,
  V,
  dot,
  softmax,
  blendOf,
  project,
  SCORES,
  ROOT,
  SCALED,
  WEIGHTS,
  OUTPUT,
  close,
  COLUMN_SUMS,
  SHORT_KEY,
  LONG_KEY,
  angleTo,
  EXPS,
  DROPPED_SHARE,
  DROPPED_OUTPUT,
  HEAD2,
  HEAD2_SCORES,
  HEAD2_WEIGHTS,
  HEAD2_OUTPUT,
  UNSCALED_WEIGHTS,
  shareSlope,
  TIED_SLOPE,
  LEAD_SLOPE,
  GAP_SHARES,
  BIRDS_PULL,
  SCORE_BYTES,
  cacheBytes,
  STABLE_SHARES,
  FP16_MAX,
  onlineSoftmax,
  TRACE,
  NEW_STATE,
  NEW_QUERY,
  NEW_SCORES,
  NEW_WEIGHTS,
  NEW_OUTPUT,
};
