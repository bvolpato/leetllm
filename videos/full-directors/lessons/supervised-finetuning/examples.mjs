import assert from 'node:assert/strict';
import {
  MASK,
  TOKENS,
  REPLY_PROBS,
  SFT_CHECKPOINTS,
} from '../../../films/supervised-finetuning/fixtures.mjs';
import {
  sftExposure,
  targetLoss,
  packedAttention,
} from '../../../films/supervised-finetuning/arithmetic.mjs';
import {
  paddingLabels,
  sftBoundaryRepair,
  sftCheckpointGate,
  sftResume,
} from '../../../films/supervised-finetuning/model.mjs';

export { TOKENS, REPLY_PROBS, SFT_CHECKPOINTS, sftExposure, sftCheckpointGate, sftResume, targetLoss };
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const avg = (xs) => sum(xs) / xs.length;
export const ignored = -100;
export const seqLabels = TOKENS.map((v, i) => (MASK[i] ? v : ignored));
export function pairs(labels) {
  return labels.flatMap((value, i) => (i && value !== ignored ? [{ from: i - 1, to: i, value }] : []));
}
export function padding(correct) {
  const labels = paddingLabels(correct);
  return {
    labels,
    links: pairs(labels),
    ids: [43, 7, 8, 2, 2, 2],
    words: ['ASSIST', 'open', 'ticket', 'END', 'PAD', 'PAD'],
  };
}
export function accounting(probs) {
  const losses = probs.map(targetLoss);
  return { losses, count: losses.length, total: sum(losses), mean: avg(losses) };
}
export function finale(repaired) {
  const state = sftBoundaryRepair(repaired);
  const labels = state.tokens.map((v, i) => (state.active[i] ? v : ignored));
  return { ...state, labels, links: pairs(labels) };
}
export function canRead(query, key, isolated = true) {
  return key <= query && (!isolated || Math.floor(key / 3) === Math.floor(query / 3));
}
export function probe(delta) {
  const values = [1 + delta, 2 + delta, 3 + delta, 10, 20, 30];
  const read = (isolated) => values.filter((_, i) => canRead(4, i, isolated));
  return {
    values,
    isolated: read(true),
    global: read(false),
    localMean: packedAttention(values, 4),
    globalMean: packedAttention(values, 4, false),
  };
}
export const micro = [[4], Array(9).fill(1)];
export const promptLoss = [0.03, 0.04, 0.02, 0.05, 0.03],
  answerLoss = [2.2, 1.8];
export function distributed(grads, count) {
  const shares = grads.map((g) => g / count);
  return {
    shares,
    reduced: avg(shares),
    corrected: avg(shares) * grads.length,
    intended: sum(grads) / count,
  };
}
export function momentum(w, v, g) {
  const velocity = 0.9 * v + g;
  return { velocity, weight: w - 0.1 * velocity };
}
export function restoreDrill(withVelocity) {
  const weight = 0.8,
    target = -0.2,
    gradient = weight - target;
  return [
    'A',
    '0.1',
    (0.5 * gradient ** 2).toFixed(2),
    String(gradient),
    momentum(weight, withVelocity ? 2 : 0, gradient).weight.toFixed(2),
  ];
}
export const rateAt = (epoch, floor) =>
  floor + ((1 - floor) * (1 + Math.cos((Math.PI * epoch) / 16))) / 2;
export function firstAdamStep(raw, maxNorm, rate) {
  const g = Math.sign(raw) * Math.min(Math.abs(raw), maxNorm),
    square = g * g;
  return { g, square, change: (rate * g) / (Math.sqrt(square) + 1e-8) };
}
export const groupRows = [
  ['T102', 'Stale key', 'Open a ticket'],
  ['B550', 'Expired key', ''],
  ['', 'Role change', 'Escalate'],
];
export const valid = (row) => row.every((value) => value.trim());
export function maskForJoin(fixed) {
  return [ignored, 'answer', 'END', fixed ? ignored : 'prompt', 'answer', 'END'];
}
export const ageAt = (t) => 14 + 4 * t;
export const needsReview = (age) => age > 14;
export function checkExamples() {
  assert.equal(needsReview(ageAt(0)), false);
  assert.equal(needsReview(ageAt(0.5)), true);
  assert.equal(ageAt(1), 18);
  assert.deepEqual(groupRows.map(valid), [true, false, false]);
  assert.deepEqual(
    pairs(seqLabels).map((k) => [k.from, k.to]),
    [
      [4, 5],
      [5, 6],
      [6, 7],
    ],
  );
  assert.equal(pairs(seqLabels.slice(0, 5)).length, 0);
  assert.equal(pairs(['open']).length, 0);
  assert.equal(accounting(REPLY_PROBS).total.toFixed(3), '1.091');
  assert.equal(accounting(REPLY_PROBS).mean.toFixed(3), '0.364');
  assert.equal(accounting(REPLY_PROBS.slice(0, 2)).mean.toFixed(3), '0.434');
  assert.deepEqual(padding(false).labels, [ignored, 7, 8, ignored, ignored, ignored]);
  assert.deepEqual(padding(true).labels, [ignored, 7, 8, 2, ignored, ignored]);
  assert.deepEqual(padding(true).links.at(-1), { from: 2, to: 3, value: 2 });
  assert.equal(targetLoss(0.8).toFixed(3), '0.223');
  assert.equal(avg(answerLoss), 2);
  assert.equal(avg([...promptLoss, ...answerLoss]).toFixed(3), '0.596');
  assert.deepEqual(
    pairs(maskForJoin(false)).map((k) => k.from),
    [0, 1, 2, 3, 4],
  );
  assert.deepEqual(
    pairs(maskForJoin(true)).map((k) => k.from),
    [0, 1, 3, 4],
  );
  for (const delta of [0, 50, 100]) {
    const s = probe(delta);
    assert.deepEqual(s.isolated, [10, 20]);
    assert.equal(s.localMean, 15);
    assert.deepEqual(s.global, s.values.slice(0, 5));
    assert.equal(s.globalMean, avg(s.global));
  }
  assert.equal(probe(0).globalMean, 7.2);
  assert.equal(probe(100).globalMean, 67.2);
  assert.equal(avg(micro.flat()), 1.3);
  assert.equal(avg(micro.map(avg)), 2.5);
  assert.deepEqual(sftExposure(4, 8, 4, 1560), { items: 128, targets: 6240 });
  assert.equal(sftExposure(2, 16, 8, 1560).items, 256);
  assert.deepEqual(distributed([2, 4], 4), {
    shares: [0.5, 1],
    reduced: 0.75,
    corrected: 1.5,
    intended: 1.5,
  });
  assert.equal(rateAt(16, 0.1), 0.1);
  assert.equal(rateAt(16, 0), 0);
  assert.equal(firstAdamStep(2, 1, 0.1).square, 1);
  assert.equal(firstAdamStep(2, 1, 0.1).change.toFixed(1), '0.1');
  for (const restored of [true, false]) {
    const step = sftResume(restored);
    const oldMoment = restored ? 0.2 : 0;
    assert.equal(step.m.toFixed(2), (0.9 * oldMoment + 0.1 * -1).toFixed(2));
    assert.equal(Math.sign(step.weight - step.saved), -Math.sign(step.m));
  }
  assert.equal(sftResume(true).weight.toFixed(3), '0.873');
  assert.equal(sftResume(false).weight.toFixed(3), '1.000');
  assert.equal(momentum(0.8, 2, 1).weight.toFixed(2), '0.52');
  assert.equal(momentum(0.8, 0, 1).weight.toFixed(2), '0.70');
  assert.deepEqual(restoreDrill(true), ['A', '0.1', '0.50', '1', '0.52']);
  assert.deepEqual(restoreDrill(false), ['A', '0.1', '0.50', '1', '0.70']);
  assert.equal(sftCheckpointGate(SFT_CHECKPOINTS, 0.98).step, 600);
  assert.equal(sftCheckpointGate(SFT_CHECKPOINTS, 1).step, 400);
  assert.equal(sftCheckpointGate(SFT_CHECKPOINTS.slice(0, 1), 1), null);
  for (const fixed of [false, true]) {
    const s = finale(fixed);
    assert.equal(s.count, 3);
    assert.equal(s.count, s.links.length);
    assert.equal(s.links.at(-1).to, fixed ? 7 : 8);
    assert.equal(s.links.at(-1).from, fixed ? 6 : 7);
    assert.equal(s.mean, accounting(s.probabilities).mean);
    assert.equal(s.mean.toFixed(3), fixed ? '0.768' : '1.461');
  }
  return true;
}
