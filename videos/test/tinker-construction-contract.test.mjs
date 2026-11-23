import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loraWorksheet,
  tinkerConstruction,
  trajectoryConstruction,
} from '../animations/deep-dive-tinker.mjs';

const state = (id, beat, progress) => ({
  beat,
  beatP: 0,
  cues: Object.fromEntries(progress.map((p, i) => [`tk-${id}-${beat}-${i}`, { progress: p }])),
});

test('supplied LoRA directions accumulate onto the same frozen base, including zero directions', () => {
  const two = loraWorksheet(2),
    four = loraWorksheet(4);
  assert.deepEqual(two.narrow, [0, 2]);
  assert.deepEqual(two.expanded, [0, 2, -2, 2]);
  assert.deepEqual(two.output, [1, 3, -2, 1]);
  assert.deepEqual(four.narrow, [0, 2, 1, -2]);
  assert.deepEqual(four.output, [1.5, 3, -3, 1]);
  assert.deepEqual(two.base, four.base);
  assert.equal(two.parameters, 20);
  assert.equal(four.parameters, 40);
  assert.deepEqual(loraWorksheet(2, 0).accumulation.sum, [1, 2, -1, 0]);
  assert.equal(two.accumulation.terms[0].zero, true);
  assert.throws(() => loraWorksheet(3), /rank two or four/);
});

test('rank-four construction starts from the completed rank-two result and holds its answer through accumulation', () => {
  const before = tinkerConstruction('lora-geometry', state('lora-geometry', 2, [1, 1, 0, 0]));
  const during = tinkerConstruction('lora-geometry', state('lora-geometry', 2, [1, 1, 0.5, 0]));
  const after = tinkerConstruction('lora-geometry', state('lora-geometry', 2, [1, 1, 1, 0]));
  assert.deepEqual(before.accumulation.sum, [1, 3, -2, 1]);
  assert.equal(before.showResult, false);
  assert.equal(during.showResult, false);
  assert.deepEqual(after.accumulation.sum, [1.5, 3, -3, 1]);
  assert.equal(after.showResult, true);
});

test('fresh run has independent target-role and sampler-version reveals and repairs', () => {
  const held = tinkerConstruction('fresh-run', state('fresh-run', 0, [1, 1, 1, 1, 1, 1]));
  assert.equal(held.showWeights, false);
  assert.equal(held.showLag, false);
  const aligned = tinkerConstruction('fresh-run', state('fresh-run', 1, [1, 1, 1, 0.999, 0, 0]));
  assert.deepEqual(aligned.weights, [0, 0, 1, 1, 1]);
  assert.equal(aligned.weights[2], 1);
  assert.equal(aligned.targets[2], 40);
  assert.equal(aligned.showMean, true);
  assert.equal(aligned.showLag, false);
  assert.equal(aligned.repaired, false);
  const stale = tinkerConstruction('fresh-run', state('fresh-run', 1, [1, 1, 1, 1, 0.5, 0]));
  assert.equal(stale.showLag, true);
  assert.equal(stale.lag, 3);
  assert.equal(stale.repaired, false);
  const repaired = tinkerConstruction('fresh-run', state('fresh-run', 1, [1, 1, 1, 1, 1, 0]));
  assert.equal(repaired.repaired, true);
});

test('sampled token and behavior score arrive together before completion credit is copied', () => {
  const first = trajectoryConstruction(state('trajectory-datum', 0, [1, 0.5, 0]));
  assert.deepEqual(first.tokens, [11, 20, null]);
  assert.deepEqual(first.logs, [0, -0.4, null]);
  assert.deepEqual(first.credits, [0, null, null]);
  assert.deepEqual(first.mask, [0, null, null]);
  const full = trajectoryConstruction(state('trajectory-datum', 0, [1, 1, 1]));
  assert.deepEqual(full.tokens, [11, 20, 21]);
  assert.deepEqual(full.logs, [0, -0.4, -0.8]);
  assert.deepEqual(full.credits, [0, 0.5, 0.5]);
  assert.deepEqual(full.mask, [0, 1, 1]);
  assert.equal(trajectoryConstruction(state('trajectory-datum', 2, [1, 1, 0.999, 0])).tool, false);
  assert.equal(trajectoryConstruction(state('trajectory-datum', 2, [1, 1, 1, 0])).tool, true);
  assert.equal(
    trajectoryConstruction(state('trajectory-datum', 2, [1, 1, 1, 0.999])).validated,
    false,
  );
});
