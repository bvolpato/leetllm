import { FRESH_LOGITS, FRESH_TARGET, GRAD, LOGITS, PROBS, TARGET, UPDATED } from './fixtures.mjs';
import {
  begun,
  bound,
  cue,
  entropy,
  lossTrace,
  onlineLogSumExp,
  phase,
  positionReduction,
  positiveTemperature,
  probabilityLossGradient,
  softmaxJacobian,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax, lerpArray } from 'vizmatic';
export function completeModel() {
  const jacobian = softmaxJacobian(PROBS),
    targetSlope = -1 / PROBS[TARGET],
    chain = jacobian[TARGET].map((value) => value * targetSlope);
  const certain = stableSoftmax([8, 0, 0]),
    squared = probabilityLossGradient(certain, [0, 1, 0]);
  const second = lossTrace(PROBS, TARGET),
    wrongGradient = PROBS.map((_, j) =>
      jacobian.reduce(
        (sum, row, i) => sum + (second.probabilities[i] - Number(i === TARGET)) * row[j],
        0,
      ),
    );
  const smooth = [0.1 / 3, 1 - 0.1 + 0.1 / 3, 0.1 / 3],
    rows = [LOGITS, FRESH_LOGITS, [100, -100, 0]],
    targets = [1, 2, -100];
  const pad = lossTrace([0, 1, 10], 1),
    excluded = lossTrace([0, 1, -Infinity], 1);
  return {
    jacobian,
    targetSlope,
    chain,
    certain,
    squared,
    second,
    wrongGradient,
    smooth,
    smoothEntropy: entropy(smooth),
    smoothGap: Math.log(smooth[1] / smooth[0]),
    sequence: positionReduction(rows, targets),
    pad,
    excluded,
    weightNumerator: 6 * Math.log(2),
    integerWeighted: Math.log(2),
    floatWeighted: 3 * Math.log(2),
    bytes: 16 * 4096 * 128256 * 4,
    tiles: onlineLogSumExp([
      [2, -1],
      [4, 0],
    ]),
    freshLosses: [Math.log(4), Math.log(2)],
    freshSum: Math.log(8),
    freshMean: Math.log(8) / 2,
  };
}
export function completeFrame(id, state = {}) {
  const beat = state.beat ?? 0,
    p = bound(state.beatP ?? 0),
    progress = (cid) => cue(state.cues, cid, state.cues ? 0 : p),
    started = (cid) => begun(state.cues, cid, state.cues ? false : p > 0.2);
  return {
    beat,
    p,
    progress,
    started,
    freshStage:
      beat < 1
        ? 0
        : beat > 1
          ? 3
          : started('fresh-mean-repair')
            ? 3
            : started('fresh-loss-sum')
              ? 2
              : started('fresh-two-losses')
                ? 1
                : 0,
  };
}
export function exponentialState(beat, progress, cues) {
  const offset = beat === 2 ? 1000 * cue(cues, 'exp-offset', phase(progress)) : 0;
  const raw = LOGITS.map((z) => z + offset);
  const shift =
    beat === 0 ? 0 : beat === 1 ? 3 * cue(cues, 'exp-shift', phase(progress)) : Math.max(...raw);
  const shifted = raw.map((z) => z - shift),
    weights = shifted.map(Math.exp);
  const shown =
    beat > 0
      ? 3
      : ['exp-ran', 'exp-slept', 'exp-ate'].filter((id, i) =>
          begun(cues, id, progress > 0.08 + i * 0.16),
        ).length;
  return {
    offset,
    raw,
    shift,
    shifted,
    weights,
    shown,
  };
}
export function massState(beat, progress, cues) {
  const perturb =
    beat === 1
      ? cue(cues, 'mass-raise', phase(progress))
      : beat === 2
        ? 1 - cue(cues, 'mass-restore', phase(progress, 0.03, 0.25))
        : 0;
  const logits = LOGITS.map((z, i) => z + Number(i === TARGET) * perturb);
  const v = lossTrace(logits, TARGET);
  const additions = [0, 1, 2].map((i) =>
    beat > 0 ? 1 : cue(cues, 'mass-add-' + i, phase(progress, 0.04 + i * 0.1, 0.13 + i * 0.1)),
  );
  const assigned =
    beat > 0
      ? 3
      : [0, 1, 2].filter((i) => begun(cues, 'mass-share-' + i, progress > 0.5 + i * 0.14)).length;
  return {
    ...v,
    perturb,
    logits,
    additions,
    assigned,
    partial: v.weights.reduce((sum, w, i) => sum + w * additions[i], 0),
  };
}
export function updateCueState(beat, scoreProgress, gainProgress, lossProgress) {
  const amount =
    beat === 0
      ? 0.5 * bound(scoreProgress)
      : beat === 1
        ? 0.5 + 0.25 * bound(gainProgress) + 0.25 * bound(lossProgress)
        : 1;
  const logits = lerpArray(LOGITS, UPDATED, amount),
    v = lossTrace(logits, TARGET);
  return {
    amount,
    logits,
    probabilities: v.probabilities,
    loss: v.loss,
  };
}
export function temperatureCueState(beat, lower, higher, mistake) {
  const temperature =
    beat === 0
      ? higher > 0
        ? 0.5 + 1.5 * bound(higher)
        : 1 - 0.5 * bound(lower)
      : beat === 1
        ? 2 - 1.65 * bound(mistake)
        : 0.35;
  return {
    temperature,
    probabilities: stableSoftmax(LOGITS, temperature),
  };
}
export function gradientState(beat, progress, cues) {
  const targetKnown = beat > 0 || begun(cues, 'gradient-target', progress > 0.2);
  const shown = [0, 1, 2].map(
    (i) =>
      beat > (i === 0 ? 0 : 1) ||
      (beat === (i === 0 ? 0 : 1) &&
        begun(cues, 'gradient-' + i, progress > (i === 0 ? 0.6 : i === 1 ? 0.08 : 0.5))),
  );
  const balance = beat === 2 ? cue(cues, 'gradient-balance', phase(progress, 0.04, 0.5)) : 0;
  const parts = GRAD.map((g, i) => g * bound(balance * 3 - i));
  return {
    targetKnown,
    shown,
    balance,
    parts,
    sum: parts.reduce((a, g) => a + g, 0),
  };
}
export function transferTarget() {
  return FRESH_TARGET;
}
export function freshState(progress = 0) {
  const before = lossTrace(FRESH_LOGITS, FRESH_TARGET),
    gradient = before.probabilities.map((p, i) => p - Number(i === FRESH_TARGET));
  const logits = FRESH_LOGITS.map((z, i) => z - 1.5 * gradient[i] * bound(progress));
  return {
    ...lossTrace(logits, FRESH_TARGET),
    logits,
    gradient,
    before,
  };
}
export function validateModel() {
  const m = completeModel();
  m.chain.forEach((g, i) => assert(Math.abs(g - GRAD[i]) < 1e-12));
  assert(Math.abs(m.squared[1]) < 0.001);
  assert(Math.abs(m.wrongGradient[1] + 0.127) < 0.001);
  assert.equal(m.sequence.count, 2);
  assert.equal(m.sequence.losses[2], 0);
  assert.equal(positionReduction([LOGITS], [-100]).updateAllowed, false);
  assert.equal(m.bytes, 33621540864);
  assert.equal(m.bytes / 2 ** 30, 31.3125);
  assert(Math.abs(m.smoothGap - Math.log(28)) < 1e-12);
  assert(
    Math.abs(
      m.tiles.at(-1).logSumExp - (4 + Math.log(Math.exp(-2) + Math.exp(-5) + 1 + Math.exp(-4))),
    ) < 1e-12,
  );
  assert.deepEqual(positiveTemperature([1e308, 1e308, 1e308], 1e-308), [1 / 3, 1 / 3, 1 / 3]);
  const v = lossTrace(LOGITS, TARGET);
  assert(Math.abs(PROBS.reduce((a, p) => a + p, 0) - 1) < 1e-12);
  assert(Math.abs(GRAD.reduce((a, g) => a + g, 0)) < 1e-12);
  assert(lossTrace(UPDATED, TARGET).probabilities[TARGET] > PROBS[TARGET]);
  assert.deepEqual(stableSoftmax(LOGITS.map((z) => z + 1000)), PROBS);
  assert.deepEqual(exponentialState(2, 1).shifted, [0, -2, -3]);
  assert.deepEqual(massState(2, 1).probabilities, PROBS);
  assert(Math.abs(v.loss + Math.log(PROBS[TARGET])) < 1e-12);
  assert.equal(lossTrace([1000, 0, -1], 1).loss, 1000);
  assert(Math.abs(lossTrace([1e20, 1e20, 1e20], 1).loss - Math.log(3)) < 1e-12);
  assert(freshState(1).probabilities[2] > freshState(0).probabilities[2]);
  assert(freshState(1).loss < freshState(0).loss);
  return true;
}
