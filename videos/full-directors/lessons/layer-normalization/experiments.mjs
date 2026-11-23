import assert from 'node:assert/strict';
import {
  x,
  start,
  row1,
  row2,
  epsilon,
  point,
  direction,
} from '../../../films/layer-normalization/fixtures.mjs';
import { mean, variance, ln, rms, F, jac } from '../../../films/layer-normalization/arithmetic.mjs';
import {
  backwardTrace,
  placementTrace,
  deepNormTrace,
  normalizationTransfer,
} from '../../../films/layer-normalization/model.mjs';
export {
  x,
  start,
  row1,
  row2,
  epsilon,
  point,
  direction,
  mean,
  variance,
  ln,
  rms,
  placementTrace,
  deepNormTrace,
  normalizationTransfer,
};
export const offset = (v, d) => v.map((n) => n + d);
export const div = (v) => Math.sqrt(variance(v) + epsilon);
export const rootMeanSquare = (v) => Math.sqrt(mean(v.map((n) => n * n)) + epsilon);
export const centered = (v) => offset(v, -mean(v));
export const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
export function stream(writes) {
  return { length: 1 + writes, share: 1 / (1 + writes) };
}
export function affine(gain, shift) {
  const gamma = [gain, 1, 1, 1],
    beta = [0, 0, 0, shift];
  const values = ln(x).map((n, i) => n * gamma[i] + beta[i]);
  return { values, gamma, beta, mean: mean(values), variance: variance(values) };
}
export function axes(d) {
  const later = offset(row2, d),
    both = [...row1, ...later];
  return {
    later,
    featureMean: mean(row1),
    sharedMean: mean(both),
    feature: ln(row1)[0],
    shared: ln(both)[0],
  };
}
export function batchReading(stored) {
  const peers = [1, 2, 100],
    m = stored ? 2 : mean(peers),
    v = stored ? 2 / 3 : variance(peers);
  return { peers, mean: m, variance: v, first: (peers[0] - m) / Math.sqrt(v + epsilon) };
}
export function probe() {
  const scale = div(point);
  const matrix = jac(point);
  const branch = direction.map(
    (_, i) =>
      -scale *
      dot(
        direction,
        matrix.map((r) => r[i]),
      ),
  );
  return { scale, branch, total: direction.map((v, i) => v + branch[i]) };
}
export function backward() {
  const first = [1, 2, 0, -1],
    second = [0.5, -0.5, 1, 0],
    secondX = offset(x, 1),
    secondZ = ln(secondX);
  const db = first.map((v, i) => v + second[i]);
  const dg = first.map((v, i) => v * ln(x)[i] + second[i] * secondZ[i]);
  return { ...backwardTrace(x, first), first, second, secondX, secondZ, db, dg };
}
export const timeCost = (n) => ({ operator: n, total: 98 + n });
export const writeGrowth = (n) => ({ aligned: 1 + n, sd: Math.sqrt(1 + n) });
export const depthStep = (rate) => [1, 8].map((g) => g * rate);
export function heldOut(bypass) {
  const baseMargins = [0.9, -1.1, -0.02, 0.7],
    branch = [0.01, -0.01, 0.04, 0.02],
    labels = [1, -1, 1, 1];
  const margins = baseMargins.map((m, i) => m + (bypass ? 0 : branch[i]));
  return { margins, labels, correct: margins.filter((m, i) => Math.sign(m) === labels[i]).length };
}
export const trainedWrite = [2, ...F(start).slice(1)];
export function deep(trained) {
  return deepNormTrace(16, start, trained ? trainedWrite : F(start));
}
export const q = [1, 1, -1, -1];
export const keyRows = [q, q.map((n) => -n)];
export const score = (k) => dot(q, k) / Math.sqrt(q.length);
export function shares(scores) {
  const m = Math.max(...scores),
    exps = scores.map((n) => Math.exp(n - m)),
    sum = exps.reduce((s, n) => s + n, 0);
  return exps.map((n) => n / sum);
}
export const halfMax = (2 - 2 ** -10) * 2 ** 15,
  sample = 300;
export function squarePath(wide) {
  const square = sample * sample,
    value = !wide && square > halfMax ? Infinity : square;
  return { value, rms: Math.sqrt(value) };
}
export const inputs16 = [10000, 10001, 9999, 10002];
export const halfStep = 2 ** (Math.floor(Math.log2(inputs16[0])) - 10);
export const stored16 = inputs16.map((n) => Math.round(n / halfStep) * halfStep);
export const secondMoment = (a) => mean(a.map((n) => n * n));
export function head(input, mode) {
  if (mode === 'LayerNorm') return ln(input);
  if (mode === 'RMSNorm') return rms(input);
  return input;
}
export function check() {
  const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} differs from ${b}`);
  const same = (a, b, tol) => {
    assert.equal(a.length, b.length);
    a.forEach((n, i) => near(n, b[i], tol));
  };
  for (let n = 0; n <= 8; n++) {
    near(stream(n).length, n + 1);
    near(stream(n).share, 1 / (n + 1));
  }
  same(centered(x), [1, -1, -3, 3]);
  near(variance(x), 5);
  same(centered(offset(x, 3)), centered(x));
  near(variance(ln(x)), 5 / (5 + epsilon));
  same(ln([7, 7, 7, 7]), [0, 0, 0, 0]);
  const z = ln(x);
  same(affine(2, 0.7).values, [2 * z[0], z[1], z[2], z[3] + 0.7]);
  const a = axes(0),
    b = axes(100);
  near(a.feature, b.feature);
  same(b.later, [102, 105, 108]);
  near(b.sharedMean, 322 / 6);
  assert.ok(b.shared !== a.shared);
  near(batchReading(false).first, ln([1, 2, 100])[0]);
  near(batchReading(true).first, ln([1, 2, 3])[0]);
  const p = placementTrace(start);
  near(p.pre[3][0], 0.89485, 0.001);
  near(mean(p.post[2]), 4.6);
  assert.ok(p.post[3][0] < -1);
  near(mean(placementTrace(p.pre[3]).pre[3]), 3.95);
  near(mean(placementTrace(p.post[3]).post[3]), 0);
  near(mean(direction), 0);
  near(dot(point, direction), 0);
  same(
    probe().branch,
    direction.map((n) => -n),
  );
  same(probe().total, [0, 0, 0, 0]);
  for (const d of [0, 0.5, 1, 2.5, 5]) {
    const v = offset(x, d);
    near(v[2] - mean(v), -3);
    same(ln(v), ln(x));
    near(rms(v)[2], v[2] / rootMeanSquare(v));
  }
  near(secondMoment(x), 9);
  near(secondMoment(offset(x, 5)), 54);
  near(rms(offset(x, 5))[2], 0.54433, 0.0001);
  near(timeCost(2).total, 100);
  near(timeCost(1).total, 99);
  near(secondMoment([1, 3, 5, 7]), 21);
  const back = backward();
  near(back.db[0], 1.5);
  near(back.dg[0], 1.5 * z[0]);
  near(mean(back.dx), 0);
  x.forEach((_, i) => {
    const h = 1e-5;
    const a = [...x],
      b = [...x];
    a[i] += h;
    b[i] -= h;
    near(back.dx[i], (dot(ln(a), back.first) - dot(ln(b), back.first)) / (2 * h), 1e-7);
  });
  same(
    depthStep(0.001),
    depthStep(0.01).map((n) => n / 10),
  );
  near(writeGrowth(8).sd, 3);
  near(writeGrowth(8).aligned, 9);
  assert.equal(heldOut(false).correct, 4);
  assert.equal(heldOut(true).correct, 3);
  near(deep(false).alpha, 32 ** 0.25);
  near(deep(false).beta, 128 ** -0.25);
  near(deep(true).sum[0], 32 ** 0.25 + 2);
  same(deep(true).output, ln(deep(true).sum));
  same(shares([1000, 1000]), shares([1800, 1800]));
  same(keyRows.map(score), [2, -2]);
  near(shares(keyRows.map(score))[0], 0.982014, 0.000001);
  near(halfMax, 65504);
  assert.equal(squarePath(false).rms, Infinity);
  near(squarePath(true).value, 90000);
  near(squarePath(true).rms, sample);
  near(halfStep, 8);
  same(stored16, [10000, 10000, 10000, 10000]);
  same(ln(stored16), [0, 0, 0, 0]);
  const { input, shifted } = normalizationTransfer();
  same(shifted, offset(input, 5));
  same(head(shifted, 'LayerNorm'), head(input, 'LayerNorm'));
  for (const v of [input, shifted]) {
    near(head(v, 'LayerNorm')[0], -1.34164, 0.00001);
    assert.ok(head(v, 'RMSNorm')[0] > 0);
  }
  return true;
}
