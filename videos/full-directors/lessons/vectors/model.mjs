import assert from 'node:assert/strict';
import {
  AXIS_TRAP,
  FRESH_H,
  H,
  P,
  R,
  REQUEST_W,
  REQUEST_X,
  WORDS,
} from '../../../films/vectors/fixtures.mjs';
import { multiplyMatrices, dotProduct } from 'vizmatic';
import {
  transpose,
  gram,
  sumRows,
  scale,
  add,
  batchedScoreState,
} from '../../../films/vectors/model.mjs';

export {
  AXIS_TRAP,
  FRESH_H,
  H,
  P,
  R,
  REQUEST_W,
  REQUEST_X,
  WORDS,
  transpose,
  gram,
  sumRows,
  scale,
  add,
  dotProduct,
};
export const project = (v, m = P) => multiplyMatrices([v], m)[0];
export const projected = H.map((prompt) => prompt.map((v) => project(v)));
export const combined = multiplyMatrices(P, R);
export const latency = REQUEST_X.map((v) => project(v, REQUEST_W));
export const featureBias = [0.1, -0.1],
  rowBias = [0.1, -0.1, 0],
  linearBias = [0.1, -0.2, 0.3];
export const offset = (i, j, byRow) => latency[i][j] + (byRow ? rowBias[i] : featureBias[j]);
export const update = (w, slope, rate) => w.map((v, j) => v - rate * slope[j]);
export const editFirst = (rows, index, by) =>
  rows.map((v, i) => (i === index ? [v[0] + by, ...v.slice(1)] : v));
export function localProjection(inputStep, appliedFraction) {
  const input = add(H[0][2], [inputStep, 0]);
  const saved = projected[0][2];
  const gain = scale(project([inputStep, 0]), appliedFraction);
  const updated = add(saved, gain);
  const rows = [projected[0].map((row, i) => i === 2 ? updated : row), projected[1]];
  return { input, saved, gain, rows };
}
export function trap(edited, repaired) {
  const h = [AXIS_TRAP[0], editFirst(AXIS_TRAP[1], 0, Number(edited))];
  const s = batchedScoreState(h);
  const right = repaired ? h[0][1] : h[1].map((v) => v[0]);
  return { h, right, grids: repaired ? s.correct : s.wrong };
}
export function cosine(v, u) {
  const lengths = Math.hypot(...v) * Math.hypot(...u);
  return lengths ? dotProduct(v, u) / lengths : null;
}
export function pool(rows, mask) {
  if (rows.length !== mask.length || mask.some((b) => typeof b !== 'boolean'))
    throw Error('mask shape or type');
  const keep = rows.filter((_, i) => mask[i]);
  if (keep.some((row) => row.some((n) => !Number.isFinite(n))))
    throw Error('nonfinite selected value');
  const sum = keep.length ? sumRows(keep) : rows[0].map(() => 0);
  return { sum, count: keep.length, mean: keep.length ? scale(sum, 1 / keep.length) : null };
}
export function dims(a) {
  if (!Array.isArray(a)) {
    if (typeof a !== 'number' || !Number.isFinite(a)) throw Error('rectangular numbers');
    return [];
  }
  if (!a.length) return [0];
  const children = a.map(dims),
    child = children[0];
  if (children.some((s) => s.join() !== child.join())) throw Error('rectangular numbers');
  return [a.length, ...child];
}
export function inspect(h, p) {
  let hs, ps;
  try {
    hs = dims(h);
    ps = dims(p);
  } catch {
    return 'rectangular numbers';
  }
  if (hs.length !== 3 || ps.length !== 2) return 'axis count';
  if (hs[2] !== ps[0]) return 'input width';
  if ([...hs, ...ps].includes(0)) return 'nonempty';
  return 'project';
}
export const cases = [
  { input: [[[1, 0], [0.5]]], map: P },
  { input: H[0], map: P },
  { input: [[[1, 0, 0.5]]], map: P },
  { input: [[[1, 0]]], map: [[], []] },
  { input: H, map: P },
];
export function check() {
  assert.deepEqual(project([1.5, 0.5]), [1.5, 0.5, 1]);
  assert.deepEqual(combined, [
    [1.5, 0.5],
    [0.5, 1.5],
  ]);
  for (const v of [...H.flat(), [-1, 0.5]])
    assert.deepEqual(project(project(v), R), project(v, combined));
  assert.deepEqual(latency, [
    [2, 0.2],
    [5, 1.9],
    [7, 2.1],
  ]);
  assert.equal(project([1, 2], REQUEST_W)[0], 4);
  assert.deepEqual(update([2, 2], [4, 2], 0.1), [1.6, 1.8]);
  assert.equal(offset(1, 0, false), 5.1);
  assert.equal(offset(1, 0, true), 4.9);
  assert.equal(offset(1, 1, true), offset(1, 1, false));
  const edited = editFirst(H[0], 2, 1);
  const waiting = localProjection(1, 0);
  assert.deepEqual(waiting.input, edited[2]);
  assert.deepEqual(waiting.rows, projected);
  const halfway = localProjection(1, 0.5);
  assert.deepEqual(halfway.gain, [0.5, 0, 0.25]);
  assert.deepEqual(halfway.rows[0][2], [1, 0.5, 0.75]);
  assert.deepEqual(localProjection(1, 1).rows, [edited.map((v) => project(v)), projected[1]]);
  assert.deepEqual(
    edited.map((v) => project(v)),
    [...projected[0].slice(0, 2), [1.5, 0.5, 1]],
  );
  assert.deepEqual(gram(edited), [
    [1, 0, 1.5],
    [0, 1, 0.5],
    [1.5, 0.5, 2.5],
  ]);
  assert.equal(cosine([0, 0], [1, 0]), null);
  assert.equal(cosine([0.5, 0.5], [1, 0]), cosine([1, 1], [1, 0]));
  for (const fixed of [false, true])
    for (const changed of [false, true]) {
      const { right, grids } = trap(changed, fixed);
      assert.equal(dotProduct(AXIS_TRAP[0][1], right), grids[0][1][1]);
      assert.equal(grids[0][1][1], fixed ? 0.5 : changed ? 0.75 : 0.25);
    }
  assert.deepEqual(trap(true, true).grids[0], trap(false, true).grids[0]);
  assert.equal(trap(true, true).grids[1][0][0], 2);
  assert.deepEqual(
    cases.map((s) => inspect(s.input, s.map)),
    ['rectangular numbers', 'axis count', 'input width', 'nonempty', 'project'],
  );
  const rows = editFirst(FRESH_H, 2, 1).map((v) => project(v));
  const a = pool(rows, [true, true, true, false]),
    b = pool(rows, [true, true, true, true]);
  assert.deepEqual(a.sum, [3, 2, 2.5]);
  assert.deepEqual(a.sum, b.sum);
  assert.deepEqual(a.mean.slice(0, 2), [1, 2 / 3]);
  assert.ok(Math.abs(a.mean[2] - 5 / 6) < 1e-12);
  assert.deepEqual(b.mean, [0.75, 0.5, 0.625]);
  assert.equal(
    pool(
      rows,
      rows.map(() => false),
    ).mean,
    null,
  );
  assert.throws(() => pool(rows, [true]));
  assert.throws(() => pool([[NaN]], [true]));
  assert.deepEqual(pool([[1], [NaN]], [true, false]).mean, [1]);
}
