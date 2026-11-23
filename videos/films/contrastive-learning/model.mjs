import { START, TAU } from './fixtures.mjs';
import {
  clip,
  comparisonRow,
  evaluate,
  maskedMean,
  nestedLoss,
  steps,
  tokenMaxSim,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax, seededRandom } from 'vizmatic';
export function scoreTemperature(beat, progress) {
  return beat < 2 ? TAU : TAU - 0.12 * clip((progress * 17.96 - 4.4875) / (7.1 - 4.4875));
}
export function denominatorSnapshot(beat, progress) {
  const elapsed = progress * 18.552;
  let masks = [1, 1, 1],
    label = 'All three candidate terms';
  if (beat === 1) {
    if (elapsed < 6.4) {
      masks[2] = 1 - clip((elapsed - 3.0625) / (4.825 - 3.0625));
      label = masks[2] < 1 ? 'Remove the easy alternative' : label;
    } else if (elapsed < 6.75) {
      masks[2] = clip((elapsed - 6.4) / 0.35);
      label = 'Restore the full comparison pool';
    } else {
      masks[1] = 1 - clip((elapsed - 6.75) / (8.175 - 6.75));
      label = 'Remove the close competitor';
    }
  } else if (beat > 1) {
    masks[1] = 0;
    label = 'Close competitor removed · retained pool';
  }
  const scores = evaluate().scores,
    max = Math.max(...scores);
  const weights = scores.map((score, i) => Math.exp((score - max) / TAU) * masks[i]);
  const denominator = weights.reduce((sum, value) => sum + value, 0);
  return {
    masks,
    weights,
    denominator,
    probability: weights[0] / denominator,
    loss: -Math.log(weights[0] / denominator),
    label,
  };
}
export function negativePoolSnapshot(beat, progress) {
  const elapsed = progress * 15.36;
  const arrival = beat > 0 ? 1 : clip((elapsed - 6.7125) / (7.8 - 6.7125));
  const hard = arrival === 1;
  return {
    arrival,
    hard,
    ...evaluate(START, hard ? [0, 1, 2] : [0, 2]),
  };
}
export function validateOriginalModel() {
  assert.equal(scoreTemperature(2, 4 / 17.96), TAU);
  assert(scoreTemperature(2, 5.5 / 17.96) < TAU);
  assert(Math.abs(scoreTemperature(2, 8 / 17.96) - 0.08) < 1e-12);
  assert(stableSoftmax(evaluate().scores, scoreTemperature(2, 8 / 17.96))[0] > evaluate().probs[0]);
  const full = denominatorSnapshot(0, 0.5),
    easy = denominatorSnapshot(1, 5 / 18.552);
  const hard = denominatorSnapshot(1, 9 / 18.552);
  assert.equal(full.masks[2], 1);
  assert.equal(easy.masks[2], 0);
  assert.equal(hard.masks[1], 0);
  assert(full.loss - easy.loss < full.loss - hard.loss);
  assert.deepEqual(denominatorSnapshot(2, 0.1).weights, hard.weights);
  assert.equal(negativePoolSnapshot(0, 6 / 15.36).hard, false);
  assert.equal(negativePoolSnapshot(0, 8 / 15.36).hard, true);
  assert(negativePoolSnapshot(0, 8 / 15.36).loss > negativePoolSnapshot(0, 6 / 15.36).loss);
  const first = evaluate(),
    h = 1e-5;
  assert(
    Math.abs((evaluate(START + h).loss - evaluate(START - h).loss) / (2 * h) - first.gradient) <
      1e-7,
  );
  assert(evaluate(steps().at(-1)).loss < first.loss);
  assert(evaluate(START, [0, 2]).loss < first.loss);
  assert(Math.abs(first.probs.reduce((s, v) => s + v, 0) - 1) < 1e-12);
  const rng = seededRandom(7);
  assert(rng() >= 0);
  return true;
}
export function validateModel() {
  validateOriginalModel();
  assert.deepEqual(
    maskedMean(
      [
        [1, 0],
        [0, 1],
        [99, 99],
      ],
      [1, 1, 0],
    ),
    [0.5, 0.5],
  );
  assert.equal(comparisonRow([1e308, 1e308], 1).loss, Math.log(2));
  assert.throws(() => comparisonRow([1e308, 1e308], 0.01));
  assert(
    Math.abs(comparisonRow([0.65, 0.65, 0.05], 0.15).gradients[1] - 3.3030842838522876) < 1e-12,
  );
  assert.equal(comparisonRow([0.65, 0.65, 0.05], 0.15, 0, [true, false, true]).gradients[1], 0);
  assert.equal(
    tokenMaxSim([
      [0.12, 0.93, 0.08],
      [0.19, 0.07, 0.91],
    ]).sum,
    1.84,
  );
  assert(nestedLoss(2) < nestedLoss(6));
  return true;
}
