import test from 'node:test';
import assert from 'node:assert/strict';
import {
  roundedOverflow,
  stochasticNeighbor,
  orientationWorksheet,
  freshGroupWorksheet,
  sampleModel,
} from '../animations/low-precision-kernels.mjs';

test('destination-precision rounding precedes overflow-mode handling', () => {
  assert.deepEqual(roundedOverflow(449), {
    input: 449,
    rounded: 448,
    overflow: false,
    result: 448,
  });
  assert.equal(roundedOverflow(465).rounded, 480);
  assert.equal(roundedOverflow(-465).result, -448);
  assert(Number.isNaN(roundedOverflow(465, { saturate: false }).result));
  assert.equal(roundedOverflow(65536, { format: 'e5m2', saturate: false }).result, Infinity);
});

test('floating-neighbor probabilities preserve the supplied value in expectation', () => {
  const s = stochasticNeighbor(1.04);
  assert(Math.abs(s.p - 0.32) < 1e-12);
  assert.equal(s.expected, 1.04);
  assert.equal(stochasticNeighbor(1).p, 0);
  assert.equal(stochasticNeighbor(1.125).p, 1);
  assert.throws(() => stochasticNeighbor(500));
});

test('regrouping rereads the fixed wider matrix rather than transposing rounded row codes', () => {
  const s = orientationWorksheet();
  assert.equal(s.matrix[0][0], 700);
  assert.equal(s.matrix[0][1], 0.001);
  assert.equal(s.rowScales[0], 2);
  assert.equal(s.columnScales[1], 2 ** -8);
  assert.equal(s.rowTiny.reconstructed, 0);
  assert.equal(s.columnTiny.reconstructed, 0.0009765625);
});

test('fresh group outcomes wait for their individual completed spoken clauses', () => {
  const f = freshGroupWorksheet();
  assert.deepEqual(
    [f.scale, f.tiny.reconstructed, f.spike.reconstructed, f.zeroScale],
    [2, 0, 704, 1],
  );
  const prediction = sampleModel('fresh-group', { beat: 0, beatP: 1 });
  for (const name of ['Scale', 'Tiny', 'Spike', 'Zero'])
    assert.equal(prediction['show' + name], false);
  const before = sampleModel('fresh-group', {
    beat: 1,
    beatP: 0.99,
    cues: {
      'lp-fresh-group-scale': { phase: 'after', progress: 1 },
      'lp-fresh-group-tiny': { phase: 'active', progress: 0.99 },
    },
  });
  assert.equal(before.showScale, true);
  assert.equal(before.showTiny, false);
  assert.equal(before.showSpike, false);
  const after = sampleModel('fresh-group', {
    beat: 1,
    beatP: 0.99,
    cues: { 'lp-fresh-group-tiny': { phase: 'after', progress: 1 } },
  });
  assert.equal(after.showTiny, true);
  assert.equal(after.showSpike, false);
});

test('delayed scaling keeps prior history until all current values have been scanned', async () => {
  const { delayedScaleReplay } = await import('../animations/low-precision-kernels.mjs');
  assert.equal(delayedScaleReplay(0).observedMax, null);
  assert.equal(delayedScaleReplay(0.25).observedMax, 16);
  const partial = delayedScaleReplay(0.5);
  assert.equal(partial.observedMax, 700);
  assert.equal(partial.complete, false);
  assert.deepEqual(partial.history, [10, 8, 6]);
  const complete = delayedScaleReplay(1);
  assert.deepEqual(complete.history, [700, 10, 8]);
  assert.equal(complete.scale, 10 / 448);
});
