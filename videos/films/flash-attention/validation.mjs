import { SCORES, VALUES } from './fixtures.mjs';
import {
  absoluteCausalPairs,
  attentionBackwardRow,
  attentionInventory,
  cachedBlend,
  finiteAccumulatorExample,
  merge,
  rescaledFirstTile,
  summarize,
  tileInventory,
  tilePipelinePrefix,
  tileStream,
} from './model.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
export function validateOriginalFlash() {
  const all = summarize(SCORES, VALUES),
    a = summarize(SCORES.slice(0, 2), VALUES.slice(0, 2)),
    b = summarize(SCORES.slice(2), VALUES.slice(2)),
    joined = merge(a, b);
  for (const key of ['m', 'l', 'u']) assert(Math.abs(joined[key] - all[key]) < 1e-12);
  const dense = stableSoftmax(SCORES).reduce((sum, v, i) => sum + v * VALUES[i], 0);
  assert(Math.abs(joined.u / joined.l - dense) < 1e-12);
  for (let i = 0; i < 3; i++)
    assert(
      Math.abs(Math.exp(SCORES[i] - (all.m + Math.log(all.l))) - stableSoftmax(SCORES)[i]) < 1e-12,
    );
  for (const p of [0, 0.12, 0.5, 0.88, 1]) {
    const r = rescaledFirstTile(p);
    assert(Math.abs(r.u / r.l - a.u / a.l) < 1e-12);
    assert(
      Math.abs(r.l - SCORES.slice(0, 2).reduce((sum, x) => sum + Math.exp(x - r.reference), 0)) <
        1e-12,
    );
  }
  assert.equal(tileStream(0).summary, null);
  assert.deepEqual(tileStream(0.4).summary, a);
  for (const key of ['m', 'l', 'u'])
    assert(Math.abs(tileStream(1).summary[key] - all[key]) < 1e-12);
  assert(Math.abs(tileStream(1).output - dense) < 1e-12);
  assert.deepEqual(absoluteCausalPairs([4, 5], [0, 1, 2, 3, 4, 5, 6, 7], 6), [
    ['allowed', 'allowed', 'allowed', 'allowed', 'allowed', 'future', 'unused', 'unused'],
    ['allowed', 'allowed', 'allowed', 'allowed', 'allowed', 'allowed', 'unused', 'unused'],
  ]);
  assert.equal(
    absoluteCausalPairs([4, 5], [0, 1, 2, 3, 4, 5, 6, 7], 6)
      .flat()
      .filter((value) => value === 'allowed').length,
    11,
  );
  assert.equal((8 * 32 * 8192 ** 2 * 2) / 2 ** 30, 32);
  assert.equal((4 * 5) / 2, 10);
  return true;
}
export function validateModel() {
  validateOriginalFlash();
  assert.equal(attentionInventory(8, 32, 8192).score, 32 * 2 ** 30);
  assert.equal(tileInventory(128, 128, 64).total, 144 * 1024);
  const g = attentionBackwardRow([0, 0], [2, 10], 3);
  assert.deepEqual(g.ds, [-6, 6]);
  assert.deepEqual(g.dv, [1.5, 1.5]);
  assert.equal(cachedBlend(5, [2, 4, 6, 8, 10, 12, 1000, 1000], 6).output, 7);
  assert.equal(finiteAccumulatorExample().accepted, false);
  assert.equal(tilePipelinePrefix(8).slots.A.tile, 2);
  return true;
}
