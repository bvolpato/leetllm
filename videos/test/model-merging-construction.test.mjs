import assert from 'node:assert/strict';
import test from 'node:test';
import {
  earnedTransferSnapshot,
  independentDropOutcomes,
  passthroughFixture,
  soupSelectionFixture,
} from '../animations/model-merging.mjs';

test('the transfer result waits for its result phrase instead of overall beat progress', () => {
  assert.equal(earnedTransferSnapshot({ beat: 0, beatP: 0.99 }).result, null);
  const halfway = earnedTransferSnapshot({
    beat: 0,
    cues: { 'earned-result': { phase: 'during', progress: 0.5 } },
  });
  assert.equal(halfway.result, null);
  assert.equal(halfway.position, 2.3);
  assert(
    Math.abs(
      earnedTransferSnapshot({ beat: 0, cues: { 'earned-result': { phase: 'after' } } }).result -
        2.1,
    ) < 1e-12,
  );
  assert(Math.abs(earnedTransferSnapshot({ beat: 1 }).result - 2.1) < 1e-12);
});

test('the independent ten-percent retention grid preserves the conditional denominator', () => {
  const result = independentDropOutcomes();
  assert.equal(result.cells.filter((c) => c.keepA).length, 10);
  assert.equal(result.cells.filter((c) => c.keepB).length, 10);
  assert.deepEqual([result.both, result.exactlyOne, result.neither], [1, 18, 81]);
  assert.equal(result.active, 19);
  assert.equal(result.conditional, 1 / 19);
});

test('selection improvement and matched passthrough interfaces do not establish task success', () => {
  const soup = soupSelectionFixture();
  assert.deepEqual(
    soup.steps.map((step) => step.accepted),
    [true, false],
  );
  assert(soup.steps[0].loss < soup.seedLoss);
  assert(soup.untouchedLoss > soup.seedLoss);
  const splice = passthroughFixture();
  assert.deepEqual(
    splice.probes.map((p) => p.output),
    [
      [16, 0],
      [0, 1],
    ],
  );
  assert.notDeepEqual(splice.probes[0].output, splice.probes[0].target);
  assert.deepEqual(splice.probes[1].output, splice.probes[1].target);
});
