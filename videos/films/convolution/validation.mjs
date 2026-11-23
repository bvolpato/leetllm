import { correlate, poolSnapshot } from './arithmetic.mjs';
import { ARTICLE_CROP, HORIZONTAL, IMAGE, OVERLAP_MAP, POOL_INCOMING, RIDGE } from './fixtures.mjs';
import { channelSnapshot, patchSnapshot, stridePaddingFrame } from './construction.mjs';
import { MAP, cropForward } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(MAP, [
    [3, 3, 0],
    [3, 3, 0],
    [3, 3, 0],
  ]);
  assert.deepEqual(correlate(IMAGE, HORIZONTAL), [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);
  assert.deepEqual(
    [0, 1 / 3, 2 / 3, 1].map((p) => patchSnapshot(0, p).subtotal),
    [0, 1, 2, 3],
  );
  assert.equal(patchSnapshot(2, 1).subtotal, 0);
  assert.deepEqual(stridePaddingFrame(0, 1).result, [
    [3, 0],
    [3, 0],
  ]);
  assert.equal(stridePaddingFrame(1, 1).sum, 2);
  assert.equal(stridePaddingFrame(2, 0).visible.length, 0);
  assert.equal(stridePaddingFrame(2, 1).visible.length, 25);
  for (let b = 0; b < 3; b++)
    for (let i = 0; i <= 100; i++) {
      const f = stridePaddingFrame(b, i / 100);
      assert.equal(f.sum, f.result[f.output[0]][f.output[1]]);
    }
  assert.equal(channelSnapshot(0).total, 6);
  assert.equal(channelSnapshot(1).total, 0);
  const near = (actual, expected) =>
    assert.ok(Math.abs(actual - expected) < 1e-10, actual + ' vs ' + expected);
  const changedFilter = RIDGE.map((row) => [...row]);
  changedFilter[0][0] = 0;
  near(correlate(ARTICLE_CROP, changedFilter)[0][0], 0.882);
  assert.deepEqual(correlate([[0, 1, 1, 1, 1, 1]], [[-1, 1]], 2), [[1, 0, 0]]);
  assert.deepEqual(correlate([[0, 0, 1, 1, 1, 1]], [[-1, 1]], 2), [[0, 0, 0]]);
  for (const [mode, expected] of [
    ['max', 4.5],
    ['average', 1.125],
  ]) {
    const pool = poolSnapshot(OVERLAP_MAP, { stride: 1, incoming: POOL_INCOMING, mode });
    near(pool.gradient[1][1], expected);
  }
  const old = cropForward();
  for (const [pixel, response, winner, scores] of [
    [0.01, 0.876, [0, 0], [1.0264, -0.6884]],
    [0.02, 0.87, [1, 1], [1.0236, -0.6866]],
  ]) {
    const crop = cropForward(pixel);
    near(crop.raw[0][0], response);
    assert.deepEqual(crop.raw.flat().slice(1), old.raw.flat().slice(1));
    assert.deepEqual(crop.pool.owners[0].input, winner);
    crop.logits.forEach((v, i) => near(v, scores[i]));
    const { gradient } = poolSnapshot(crop.activated, { incoming: [[-2]] });
    assert.equal(gradient[winner[0]][winner[1]], -2);
    assert.equal(gradient.flat().filter((v) => v !== 0).length, 1);
  }
  return true;
}
