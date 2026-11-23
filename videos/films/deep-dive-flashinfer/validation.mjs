import { merge, mergeReference, prefix } from './arithmetic.mjs';
import { requests } from './fixtures.mjs';
import {
  flashinferExtensionFrame,
  mergeConstruction,
  pageLookupFrame,
  sampleModel,
} from './construction.mjs';
import { address, readSlot, splitExample } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const early = readSlot({ writeBefore: true, read: true, writeAfter: false });
  const waiting = readSlot({ writeBefore: false, read: true, writeAfter: true });
  assert.deepEqual(early.value, waiting.value);
  assert.deepEqual(early.returned, [1, 0]);
  assert.deepEqual(waiting.returned, [0, 1]);
  for (const [lastScore, expectedShares, expectedMass] of [
    [0, [2 / 3, 1 / 3], 6],
    [Math.log(3), [0.5, 0.5], 8],
  ]) {
    const { mass, result } = splitExample(lastScore);
    assert.equal(mass.length, 6);
    assert(result.output.every((value, i) => Math.abs(value - expectedShares[i]) < 1e-12));
    assert(Math.abs(result.b - Math.log2(expectedMass)) < 1e-12);
  }
  assert.equal(flashinferExtensionFrame('causal-rule', { beat: 4, beatP: 1 }).maskBoundary, 5);
  assert.deepEqual(mergeReference([0, 0], -Infinity, [1, 2], 0), {
    output: [1, 2],
    b: 0,
  });
  assert.equal(mergeReference([1e308], 0, [1e308], 0).output[0], 1e308);
  assert.throws(() => mergeReference([1], -Infinity, [2], 0), RangeError);
  assert.equal(
    flashinferExtensionFrame('offset-migration', {
      beat: 2,
      beatP: 1,
    }).q[1],
    18432,
  );
  assert.equal(
    flashinferExtensionFrame('offset-migration', {
      beat: 2,
      beatP: 1,
    }).o[1],
    12288,
  );
  assert.deepEqual(prefix(requests.map((r) => r.q)), [0, 3, 4, 8]);
  assert.deepEqual(prefix(requests.map((r) => r.pages.length)), [0, 2, 3, 6]);
  assert.deepEqual(
    requests.map((r) => (r.pages.length - 1) * 4 + r.tail),
    [6, 2, 9],
  );
  assert.deepEqual(address(5), {
    page: 14,
    slot: 1,
  });
  assert.deepEqual(address(8), {
    page: 6,
    slot: 0,
  });
  assert.equal(pageLookupFrame(5, 1, 0.1).stage, 1);
  assert.equal(pageLookupFrame(5, 1, 0.5).entry, 1);
  assert.equal(pageLookupFrame(5, 1, 0.9).slot, 1);
  assert.equal(mergeConstruction(0, 0.99).received, 0);
  assert.equal(mergeConstruction(1, 0.12).received, 0);
  assert.deepEqual(mergeConstruction(1, 0.5).output, [2 / 3, 1 / 3]);
  assert.deepEqual(mergeConstruction(1, 0.88).output, mergeConstruction(2, 0).output);
  const merged = merge([1, 0], 2, [0, 1], 1);
  assert(Math.abs(merged.output[0] - 2 / 3) < 1e-12);
  assert(Math.abs(merged.b - Math.log2(6)) < 1e-12);
  assert(Math.abs(merge([1, 0], 2 * Math.LN2, [0, 1], Math.LN2).output[0] - 2 / 3) > 0.04);
  assert.equal(
    sampleModel('planning', {
      beat: 1,
      beatP: 0,
    }).valid,
    true,
  );
  assert.equal(
    sampleModel('planning', {
      beat: 1,
      beatP: 0.5,
    }).valid,
    false,
  );
  assert.equal(
    sampleModel('planning', {
      beat: 2,
      beatP: 0.8,
    }).valid,
    true,
  );
  assert.equal(
    sampleModel('planning', {
      beat: 2,
      beatP: 0,
    }).currentLength,
    10,
  );
  assert.deepEqual(
    sampleModel('causal', {
      beat: 0,
      beatP: 0,
    }).mask.map((row) => row.filter(Boolean).length),
    [6, 7, 8, 9],
  );
  return true;
}
