import { sigmoid, stableBce } from './arithmetic.mjs';
import { PARAMETERS, REQUESTS, TARGETS } from './fixtures.mjs';
export function requestForward(x, params = PARAMETERS) {
  const z1 = params.w1.map((row, i) => row.reduce((s, w, j) => s + w * x[j], params.b1[i]));
  const h = z1.map((z) => Math.max(0, z));
  const z2 = h.reduce((s, v, j) => s + v * params.w2[j], params.b2);
  return {
    x,
    z1,
    h,
    z2,
    score: sigmoid(z2),
  };
}
export function backward(x, y, params = PARAMETERS) {
  const f = requestForward(x, params),
    dz2 = f.score - y;
  const dh = params.w2.map((w) => dz2 * w),
    dz1 = dh.map((g, i) => (f.z1[i] > 0 ? g : 0));
  return {
    ...f,
    y,
    loss: stableBce(f.z2, y),
    dz2,
    dh,
    dz1,
    dw2: f.h.map((h) => dz2 * h),
    db2: dz2,
    dw1: dz1.map((g) => x.map((v) => g * v)),
    db1: dz1,
  };
}
export function batchGradient(params = PARAMETERS) {
  const rows = REQUESTS.map((x, i) => backward(x, TARGETS[i], params));
  const mean = (fn) => rows.reduce((s, row) => s + fn(row), 0) / rows.length;
  return {
    rows,
    loss: mean((r) => r.loss),
    dw1: [0, 1].map((i) => [0, 1].map((j) => mean((r) => r.dw1[i][j]))),
    db1: [0, 1].map((i) => mean((r) => r.db1[i])),
    dw2: [0, 1].map((i) => mean((r) => r.dw2[i])),
    db2: mean((r) => r.db2),
  };
}
export function transposeExample(x = [2, 5]) {
  return {
    right: PARAMETERS.w1.map((row) => row.reduce((s, w, j) => s + x[j] * w, 0)),
    wrong: [0, 1].map((j) => x.reduce((s, v, i) => s + v * PARAMETERS.w1[i][j], 0)),
  };
}
export const freshGradient = () => backward([-1, 2], 1);
export function affineWitness() {
  const positive = requestForward([1, 4]).z2,
    negative = requestForward([-1, -4]).z2,
    zero = requestForward([0, 0]).z2;
  return {
    positive,
    negative,
    zero,
    pair: positive + negative,
    doubleZero: 2 * zero,
  };
}
