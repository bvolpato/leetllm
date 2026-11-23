import assert from 'node:assert/strict';
import { seededRandom } from 'vizmatic/stage';
import {
  candidates,
  code,
  dictionary,
  OBSERVATION_CONTEXTS,
} from '../../../films/sparse-autoencoders/fixtures.mjs';
import { topK, encoderFixture } from '../../../films/sparse-autoencoders/model.mjs';

export { candidates, code, dictionary, OBSERVATION_CONTEXTS, topK, encoderFixture };
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const mul = (v, a) => v.map((n) => n * a);
export const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export const amount = (z) => z.reduce((s, v) => s + Math.abs(v), 0);
export const support = (z) => z.filter((v) => v !== 0).length;
export const positive = (v) => Math.max(0, v);
export const decode = (z, scale = 1) =>
  z.reduce((p, a, i) => add(p, mul(dictionary[i], a * scale)), [0, 0]);
export const target = decode(code);
export const mse = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / a.length;
export function request(urgent, credential = 1, urgency = 1, error = 0) {
  const parts = [
    mul(dictionary[0], code[0] * credential),
    mul(dictionary[1], urgent * urgency),
    [0, error],
  ];
  const x = parts.reduce(add, [0, 0]);
  return { parts, x, score: dot(x, [1, 2]) };
}
export const cost = (z, lambda, scale = 1) =>
  mse(target, decode(z, scale)) + (lambda * amount(z)) / z.length;
export const shortCode = [1.5, 0, 0, 0, 0];
export const shrink = (a, lambda) => positive(a - lambda / 2);
export function shrinkCase(first, second, last) {
  const weight = Number((1.2 * first + 0.6 * second + 0.2 * last).toFixed(2));
  const z = shrink(1, weight);
  return { weight, z, count: support([1.5, z]) };
}
export const jump = (v, theta) => (v > theta ? v : 0);
export const bound = (d) => 24 * 23 * Math.exp((-d * 0.5 ** 2) / 2);
export function pairRatios() {
  const random = seededRandom(5);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const points = Array.from({ length: 8 }, () => Array.from({ length: 256 }, gauss));
  const map = Array.from({ length: 64 }, () => Array.from({ length: 256 }, () => gauss() / 8));
  const reduced = points.map((p) => map.map((row) => dot(row, p)));
  const ratios = [];
  for (let i = 0; i < 8; i++)
    for (let j = i + 1; j < 8; j++)
      ratios.push((mse(reduced[i], reduced[j]) * 64) / (mse(points[i], points[j]) * 256));
  return ratios;
}
export const ratios = pairRatios();
const random = seededRandom(1);
export const overlaps = {};
for (const d of [16, 64, 256]) {
  const dirs = Array.from({ length: 24 }, () =>
    Array.from({ length: d }, () => (random() < 0.5 ? -1 : 1) / Math.sqrt(d)),
  );
  overlaps[d] = dirs.map((a) => dirs.map((b) => dot(a, b)));
}
export const leakage = (n) => n * 0.1;
export function ablate(horizontal, vertical) {
  const x = [horizontal, vertical];
  return { x, score: dot(x, [0, 100]) };
}
export function steer(alpha) {
  const x = add([0.2, 0.1], mul([0, 1], alpha));
  return {
    x,
    read: [
      [0, 1],
      [1, 0],
      [0.6, 0.8],
    ].map((r) => dot(r, x)),
  };
}
export const fourInput = [0.3, -0.4, 0.2, 0.7],
  fourColumn = [0, 0.5, 0.5, 0];
export const fourEdit = (alpha) => add(fourInput, mul(fourColumn, alpha));
export const clampState = (step) => {
  const x = add([1, 0.5], mul([0, 1], step));
  return { x, cached: 2 + step, reencoded: positive(dot(x, [1, 2])), sum: dot(x, [1, 1]) };
};
export function nudge(delta, fixed) {
  const write = [1 + delta, 0];
  const error = [fixed ? 0 : -delta, 0.1];
  const end = add(write, error);
  return { write, error, end, score: dot(end, [3, 100]) };
}
export function bird(sparrow) {
  const input = [1, Number(sparrow)];
  const z = [positive(input[0] - input[1]), Math.SQRT2 * input[1]];
  const writes = [mul([1, 0], z[0]), mul([Math.SQRT1_2, Math.SQRT1_2], z[1])];
  return { input, z, writes, rebuilt: add(...writes) };
}
export function recovery(baseline, clean = 2, rebuilt = 2.4) {
  return baseline === clean ? null : 1 - (rebuilt - clean) / (baseline - clean);
}
export function circuit(credential = 0.9, format = 0.7) {
  const input = [credential, 0.8, format],
    weights = [1.2, 0.1, 0];
  const writes = input.map((v, i) => v * weights[i]);
  return { input, weights, writes, score: writes.reduce((a, b) => a + b) };
}
// One scalar residual coordinate, unit projections and a fixed attention pattern.
// Other tokens and the intervening MLP output contribute constants to this derivative.
export function directEdge(source, selfWeight) {
  const skip = source;
  const viaValue = selfWeight * source;
  return { source, selfWeight, skip, viaValue, gain: 1 + selfWeight, contribution: skip + viaValue };
}
// Absolute best matches from the course's seeded NumPy run, in generating-direction order.
export const align = [
  [
    0.805, 0.7376, 0.8176, 0.8472, 0.6651, 0.8824, 0.8079, 0.8274, 0.8418, 0.7909, 0.7273, 0.7687,
    0.8897, 0.6427, 0.8571, 0.8976, 0.7258, 0.6787, 0.7644, 0.8057, 0.7547, 0.6553, 0.9388, 0.711,
  ],
  [
    0.7947, 0.722, 0.8132, 0.8419, 0.6869, 0.867, 0.8247, 0.8184, 0.8395, 0.8031, 0.7117, 0.7726,
    0.8714, 0.6398, 0.8507, 0.9037, 0.7356, 0.697, 0.7793, 0.8061, 0.7491, 0.6579, 0.9183, 0.7009,
  ],
];
export const median = (a) => {
  const s = a.toSorted((a, b) => a - b);
  return (s[11] + s[12]) / 2;
};
export const alignmentCutoff = 0.9;
export const highMatches = align[1].flatMap((value, i) =>
  value >= alignmentCutoff ? [{ i, alreadyHigh: align[0][i] >= alignmentCutoff }] : [],
);
export const lab = {
  mse: [1.426, 0.128],
  active: [18.9, 19.5],
  heldMse: 0.128,
  meanMse: 0.757,
  vectors: 200000,
  width: 4096,
  bytes: 4,
};

export function check() {
  const eq = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
  const vector = (a, b) => {
    assert.equal(a.length, b.length);
    a.forEach((v, i) => eq(v, b[i]));
  };
  vector(target, [2.3, 0.6]);
  vector(encoderFixture(target).estimated, code);
  for (const d of dictionary) eq(Math.hypot(...d), 1);
  eq(ratios.length, 28);
  assert.ok(ratios.every((x) => x >= 0.5 && x <= 1.5));
  for (const d of [16, 64, 256]) overlaps[d].forEach((row, i) => eq(row[i], 1));
  assert.ok(bound(16) > 1 && bound(256) < 0.001);
  eq(leakage(12), 1.2);
  eq(leakage(4), 0.4);
  eq(mse(target, decode(shortCode)), 0.5);
  eq(cost(code, 2.5), 1.25);
  eq(cost(code, 2.5), cost(shortCode, 2.5));
  eq(cost(code, 4), 2);
  eq(cost(shortCode, 4), 1.7);
  vector(decode(mul(code, 0.5), 2), target);
  eq(cost(mul(code, 0.5), 4, 2), 1);
  [0, 1.2, 1.8, 2, 3].forEach((l, i) => eq(shrink(1, l), [1, 0.4, 0.1, 0, 0][i]));
  eq(shrinkCase(1, 1, 1).count, 1);
  eq(shrinkCase(1, 1, 0.5).count, 2);
  eq(shrinkCase(1, 0, 0).z, 0.4);
  vector(topK(candidates, 2), [0, 2.4, 0, 1.7, 0]);
  eq(support(topK([-1, 2.4, -1, -1, -1], 2)), 1);
  eq(jump(0.5, 0.5), 0);
  eq(jump(0.51, 0.5), 0.51);
  assert.deepEqual(
    OBSERVATION_CONTEXTS.map(({ pre }) => jump(pre[4], 2) > 0),
    [false, false, false, true],
  );
  for (const h of [0, 0.5, 1]) {
    eq(ablate(h, 0.1).score, 10);
    eq(ablate(h, 0).score, 0);
  }
  eq(mse([1, 0.1], [1, 0]), 0.005);
  vector(steer(2).read, [2.1, 0.2, 1.8]);
  vector(fourEdit(2), [0.3, 0.6, 1.2, 0.7]);
  eq(clampState(1).cached, 3);
  eq(clampState(1).reencoded, 4);
  eq(clampState(1).sum, 2.5);
  eq(nudge(0.2, false).score, 13);
  eq((nudge(0.2, true).score - 13) / 0.2, 3);
  for (const s of [false, true]) vector(bird(s).input, bird(s).rebuilt);
  eq(bird(true).z[0], 0);
  eq(circuit().score, 1.16);
  eq(circuit(0).score, 0.08);
  eq(circuit(0.9, 0).score, 1.16);
  const edge = directEdge(2, 0.5);
  eq(edge.skip, 2);
  eq(edge.viaValue, 1);
  eq(edge.contribution, 3);
  eq(edge.source * edge.gain, edge.contribution);
  eq(directEdge(3, edge.selfWeight).contribution - edge.contribution, edge.gain);
  eq(recovery(6), 0.9);
  eq(recovery(10), 0.95);
  assert.equal(recovery(2), null);
  assert.deepEqual(
    align.map((a) => Number(median(a).toFixed(3))),
    [0.798, 0.799],
  );
  assert.deepEqual(
    align.map((a) => a.filter((v) => v >= alignmentCutoff).length),
    [1, 2],
  );
  assert.deepEqual(highMatches, [{ i: 15, alreadyHigh: false }, { i: 22, alreadyHigh: true }]);
  assert.ok(1 - lab.mse[1] / lab.mse[0] > 0.9);
  eq(Number((lab.heldMse / lab.meanMse).toFixed(3)), 0.169);
  for (const [blue, pink, expected] of [
    [1, 1, [1.7, 3.7]],
    [0, 1, [0.2, 2.2]],
    [1, 0, [1.7, 1.7]],
  ])
    vector(
      [0, 1].map((u) => request(u, blue, pink, 0.1).score),
      expected,
    );
}
