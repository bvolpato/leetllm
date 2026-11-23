import { discountedTrace, mv, norm, scalarTrace, sigmoid, sum } from './arithmetic.mjs';
import { inputs, openingWords, scalar, states, wh, wx } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { dotProduct } from 'vizmatic';
export function actorMemoryTrace(actor = 'dog') {
  assert.ok(actor === 'dog' || actor === 'cat', 'The toy actor feature accepts dog or cat');
  const words = actor === 'dog' ? openingWords : ['The', 'cat', 'chased', 'the', 'dog'];
  const inputs = words.map((_, index) => (index === 1 ? (actor === 'dog' ? 0.8 : -0.8) : 0));
  const states = [0];
  for (const input of inputs) states.push(Math.tanh(input + 0.9 * states.at(-1)));
  return {
    actor,
    words,
    inputs,
    states,
    final: states.at(-1),
    padded: Math.tanh(0.9 * states.at(-1)),
  };
}
export function incidentModel() {
  const factors = scalar.slice(1).map((value) => 0.5 * (1 - value * value));
  const sensitivities = [1];
  for (const factor of factors.toReversed()) sensitivities.push(sensitivities.at(-1) * factor);
  const inputGradient = scalar
    .slice(1)
    .map((value, i) => 0.8 * (1 - value * value) * factors.slice(i + 1).reduce((a, b) => a * b, 1));
  const weightTerms = scalar
    .slice(1)
    .map(
      (value, i) =>
        scalar[i] * (1 - value * value) * factors.slice(i + 1).reduce((a, b) => a * b, 1),
    );
  const readout = [
      [0.7, -0.3],
      [-0.4, 0.8],
      [0.1, 0.2],
    ],
    roundedState = [0.39, 0.655];
  const logits = mv(readout, roundedState),
    exps = logits.map((value) => Math.exp(value - Math.max(...logits)));
  const hOld = [0.4, -0.2],
    cOld = [0.855, 0.1],
    joined = [...hOld, 0, 1, 0];
  const forgetMatrix = [
      [1, 0, 0, 0.6, 0],
      [0, 0, 0, -0.5, 0],
    ],
    forgetLogits = mv(forgetMatrix, joined);
  const f = forgetLogits.map(sigmoid),
    i = [-1, 0].map(sigmoid),
    candidate = [0.5, 0].map(Math.tanh),
    o = [Math.log(4), 0].map(sigmoid);
  const retained = f.map((value, j) => value * cOld[j]),
    written = i.map((value, j) => value * candidate[j]);
  const nextCell = retained.map((value, j) => value + written[j]),
    nextHidden = nextCell.map((value, j) => o[j] * Math.tanh(value));
  const reset = gruResetComparison(),
    z = [Math.log(19), 0].map(sigmoid);
  const gruBefore = reset.beforeCandidate.map(
    (value, j) => z[j] * reset.hidden[j] + (1 - z[j]) * value,
  );
  const gruAfter = reset.afterCandidate.map(
    (value, j) => z[j] * reset.hidden[j] + (1 - z[j]) * value,
  );
  const rawGradient = [1.4 ** 12, -0.8 * 1.4 ** 12],
    clippedGradient = rawGradient.map((value) => (value * 5) / norm(rawGradient));
  const junk = wx.map((row, j) =>
    Math.tanh(dotProduct(row, [9, -9, 9]) + dotProduct(wh[j], states[2])),
  );
  const fresh = scalarTrace([0.2, 0.8, 0]);
  return {
    factors,
    sensitivities,
    inputGradient,
    weightTerms,
    weightGradient: sum(weightTerms),
    readout,
    roundedState,
    logits,
    probabilities: exps.map((value) => value / sum(exps)),
    discount: discountedTrace(inputs),
    reverseDiscount: discountedTrace(inputs.toReversed()),
    lstm: {
      hOld,
      cOld,
      joined,
      forgetMatrix,
      forgetLogits,
      f,
      i,
      candidate,
      o,
      retained,
      written,
      nextCell,
      nextHidden,
    },
    gru: {
      ...reset,
      z,
      beforeHidden: gruBefore,
      afterHidden: gruAfter,
    },
    rawGradient,
    clippedGradient,
    junk,
    fresh,
    matrixPowers: Array.from(
      {
        length: 13,
      },
      (_, n) => (n === 0 ? [0, 1] : [n * 0.5 ** (n - 1), 0.5 ** n]),
    ),
    resetNext: Math.tanh(0.8 * 0.4),
    leakedNext: Math.tanh(0.8 * 0.4 + 0.5 * scalar.at(-1)),
  };
}
export function gruResetComparison({
  hidden = [0.8, -0.2],
  reset = [0.1, 0.9],
  recurrent = [
    [1, 2],
    [3, 4],
  ],
} = {}) {
  const projected = recurrent.map((row) => dotProduct(row, hidden)),
    resetHidden = hidden.map((value, i) => value * reset[i]);
  const before = recurrent.map((row) => dotProduct(row, resetHidden)),
    after = projected.map((value, i) => value * reset[i]);
  return {
    hidden,
    reset,
    recurrent,
    projected,
    resetHidden,
    before,
    after,
    beforeCandidate: before.map(Math.tanh),
    afterCandidate: after.map(Math.tanh),
  };
}
