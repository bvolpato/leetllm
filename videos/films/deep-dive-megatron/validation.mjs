import { sum } from './arithmetic.mjs';
import { checkpointLayout, contextMergeSnapshot, forwardWave } from './construction.mjs';
import { checkpointRow, trackedColumn } from './fixtures.mjs';
import { coords, group, mlp, momentumReceipt, rankOf, sampleModel } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(contextMergeSnapshot(0, 0.99).value, 5.25);
  assert.equal(contextMergeSnapshot(1, 0.25).value, 4.6);
  assert.equal(contextMergeSnapshot(1, 0.9).count, 7);
  assert.equal(contextMergeSnapshot(1, 0.9).value, 29 / 7);
  for (let rank = 0; rank < 64; rank++) assert.equal(rankOf(coords(rank)), rank);
  assert.deepEqual(group(3, 'tp'), [0, 1, 2, 3]);
  assert.deepEqual(group(3, 'pp'), [3, 35]);
  assert.deepEqual(group(3, 'dp'), [3, 11, 19, 27]);
  const model = mlp();
  assert.deepEqual(model.pre, [1, 2, 1, 0.5]);
  model.output.forEach((v, i) => assert(Math.abs(v - model.serial[i]) < 1e-12));
  assert.equal(
    sampleModel('tensor', {
      beat: 1,
      beatP: 0.25,
    }).partialReady,
    false,
  );
  for (const beatP of [0.6, 0.75, 0.99]) {
    const tensor = sampleModel('tensor', {
      beat: 1,
      beatP,
    });
    assert.equal(tensor.partialReady, true);
    assert.equal(tensor.sumReady, false);
    assert.deepEqual(tensor.partials, model.partials);
  }
  assert.equal(
    sampleModel('tensor', {
      beat: 2,
      beatP: 0,
    }).sumReady,
    true,
  );
  const c = sampleModel('context', {
    beat: 0,
    beatP: 0,
  });
  assert(Math.abs(c.global - c.merged) < 1e-12);
  assert(Math.abs(c.means[0] - c.global) > 1);
  const e = sampleModel('experts', {
    beat: 2,
    beatP: 0,
  });
  assert.equal(e.attentionWorld, e.expertWorld);
  e.combined.forEach((v, j) =>
    assert.equal(v, sum(e.outputs.map((row, i) => row[j] * e.weights[i]))),
  );
  assert.equal(
    sampleModel('pipeline', {
      beat: 1,
      beatP: 0,
    }).bubble,
    1 / 9,
  );
  assert.equal(
    sampleModel('pipeline', {
      beat: 2,
      beatP: 0,
    }).microbatches,
    64 / (2 * 8),
  );
  assert.equal(
    sampleModel('optimizer', {
      beat: 2,
      beatP: 0,
    }).total,
    7.5,
  );
  const objective = sampleModel('optimizer', {
    beat: 2,
    beatP: 0,
  });
  assert.deepEqual(objective.localMeans, [10, 0]);
  assert.equal(objective.tokenCount, 4);
  assert.equal(objective.wrongGradient, 5);
  assert.equal(objective.tokenGradient, 2.5);
  assert.equal(
    sampleModel('recovery', {
      beat: 1,
      beatP: 0,
    }).complete,
    false,
  );
  const missing = checkpointLayout(2);
  assert.deepEqual(missing.target[1], [null, null, 1.5, 8]);
  const restored = checkpointLayout();
  assert.deepEqual(restored.target.flat(), checkpointRow);
  assert.equal(restored.target[1][2], missing.reconstructed[trackedColumn]);
  for (const [dp, slots, idleFraction] of [
    [4, 18, 1 / 9],
    [8, 10, 1 / 5],
  ]) {
    const wave = forwardWave(64 / (2 * dp));
    assert.equal(wave.slots, slots);
    assert.equal(wave.bubble, idleFraction);
  }
  for (const [v, x, next] of [
    [0.8, 2, 1.26],
    [0, 2, 1.3],
    [0.8, 1, 1.51],
  ]) {
    assert(
      Math.abs(momentumReceipt(checkpointRow[trackedColumn], v, x, 2).nextWeight - next) < 1e-12,
    );
  }
  return true;
}
