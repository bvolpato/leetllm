import { IMAGE_FEATURES, TEXT_FEATURES } from './fixtures.mjs';
import { pairLogisticLoss, prefixCosts } from './arithmetic.mjs';
import { computeClipFixture, reductionDecision } from './model.mjs';
import { FIXTURE, TEACHING_GRADIENT, TRACKS, sceneSnapshots } from './observations.mjs';
import { contrastiveStep, trainingStepFrame } from './training.mjs';
import { chooseCandidate, initialPrompts, revisedPrompts } from './inspection-policy.mjs';
import assert from 'node:assert/strict';
import { dotProduct } from 'vizmatic';
export function validateModel() {
  assert.deepEqual(prefixCosts(), {
    visual: 2304,
    total: 2484,
    bytesPerToken: 327680,
    visualMiB: 720,
  });
  assert.equal(reductionDecision(2).route, 'review');
  assert.equal(reductionDecision(3).selected.length, 3);
  assert(Math.abs(pairLogisticLoss(3.2, true) - 0.03995333316243036) < 1e-12);
  assert.throws(() => computeClipFixture([[0, 0, 0]], [[1, 0, 0]]));
  assert.throws(() => computeClipFixture([[Infinity, 0, 0]], [[1, 0, 0]]));
  assert.equal(FIXTURE.images.length, 3);
  assert.equal(FIXTURE.texts.length, 3);
  assert(FIXTURE.images.every((vector) => Math.abs(Math.hypot(...vector) - 1) < 1e-12));
  assert(FIXTURE.texts.every((vector) => Math.abs(Math.hypot(...vector) - 1) < 1e-12));
  assert(
    FIXTURE.rowProbabilities.every(
      (row) => Math.abs(row.reduce((sum, value) => sum + value, 0) - 1) < 1e-12,
    ),
  );
  assert(
    FIXTURE.columnProbabilities.every(
      (column) => Math.abs(column.reduce((sum, value) => sum + value, 0) - 1) < 1e-12,
    ),
  );
  assert(FIXTURE.logits.every((row) => row.every(Number.isFinite)));
  assert(Math.abs(FIXTURE.logits[0][0] - 4.9966) < 0.001);
  assert(Math.abs(FIXTURE.symmetricLoss - 0.021904) < 0.00001);
  assert.equal(FIXTURE.queryScores.indexOf(Math.max(...FIXTURE.queryScores)), 0);
  assert.equal(FIXTURE.retrievalScores.indexOf(Math.max(...FIXTURE.retrievalScores)), 0);
  const threeImages = [[1, 0], [0, 1], [-1, 0]];
  assert.deepEqual(computeClipFixture(threeImages, threeImages).retrievalScores, [1, 0, -1]);
  for (const [prompts, gap, passes] of [[initialPrompts, 0.13, true], [revisedPrompts, 0.05, false]]) {
    const decision = chooseCandidate(prompts);
    assert.equal(decision.best.score, 0.62);
    assert(Math.abs(decision.gap - gap) < 1e-12);
    assert.equal(decision.passes, passes);
  }
  const epsilon = 1e-6;
  for (const [side, features] of [
    ['images', IMAGE_FEATURES],
    ['texts', TEXT_FEATURES],
  ]) {
    for (let row = 0; row < features.length; row += 1) {
      assert(Math.abs(dotProduct(features[row], TEACHING_GRADIENT[side][row])) < 1e-12);
      for (let feature = 0; feature < features[row].length; feature += 1) {
        const lossAt = (delta) => {
          const images = IMAGE_FEATURES.map((vector) => [...vector]),
            texts = TEXT_FEATURES.map((vector) => [...vector]);
          (side === 'images' ? images : texts)[row][feature] += delta;
          return computeClipFixture(images, texts).symmetricLoss;
        };
        const numerical = (lossAt(epsilon) - lossAt(-epsilon)) / (2 * epsilon);
        assert(Math.abs(numerical - TEACHING_GRADIENT[side][row][feature]) < 1e-8);
      }
    }
  }
  let previousLoss = FIXTURE.symmetricLoss;
  for (let step = 0; step <= 100; step += 1) {
    const current = contrastiveStep(step / 100);
    assert(current.symmetricLoss <= previousLoss + 1e-12);
    assert(
      current.images
        .concat(current.texts)
        .every((vector) => Math.abs(Math.hypot(...vector) - 1) < 1e-12),
    );
    previousLoss = current.symmetricLoss;
  }
  const updated = contrastiveStep(1);
  assert(updated.imageToTextLoss < FIXTURE.imageToTextLoss);
  assert(updated.textToImageLoss < FIXTURE.textToImageLoss);
  assert(updated.rowProbabilities[0][0] > FIXTURE.rowProbabilities[0][0]);
  assert(
    updated.rowProbabilities[0]
      .slice(1)
      .every((value, index) => value < FIXTURE.rowProbabilities[0][index + 1]),
  );
  for (const side of ['images', 'texts'])
    assert(
      updated[side].every((vector, index) =>
        vector.some((value, feature) => Math.abs(value - FIXTURE[side][index][feature]) > 1e-4),
      ),
    );
  assert.equal(
    trainingStepFrame({
      beat: 0,
      beatP: 0.99,
    }).amount,
    0,
  );
  assert.equal(
    trainingStepFrame({
      beat: 1,
      beatP: 0,
    }).amount,
    0,
  );
  assert.equal(
    trainingStepFrame({
      beat: 2,
      beatP: 0,
    }).amount,
    1,
  );
  assert(
    trainingStepFrame({
      beat: 1,
      beatP: 0.5,
    }).symmetricLoss < FIXTURE.symmetricLoss,
  );
  for (const [sceneId, snapshots] of Object.entries(sceneSnapshots)) {
    for (let beat = 0; beat < snapshots.length; beat += 1) {
      for (const beatP of [0, 0.3, 0.5, 0.99]) {
        assert.deepEqual(
          TRACKS[sceneId].sample({
            beat,
            beatP,
          }).snapshot,
          snapshots[beat],
        );
      }
    }
  }
  return true;
}
