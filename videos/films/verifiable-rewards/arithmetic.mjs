import { EVALUATION_FIXTURE, REWARDS } from './fixtures.mjs';
import { capacityScore, freshProduct, freshRecords } from './capacity.mjs';
import assert from 'node:assert/strict';
export function groupStatistics(rewards = REWARDS) {
  const mean = rewards.reduce((sum, value) => sum + value, 0) / rewards.length;
  const std = Math.sqrt(
    rewards.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rewards.length,
  );
  return {
    mean,
    std,
    advantages: std === 0 ? rewards.map(() => 0) : rewards.map((value) => (value - mean) / std),
  };
}
export function categoricalUpdate(advantages = groupStatistics().advantages, step = 1) {
  const logits = advantages.map((value) => (step * value) / advantages.length);
  const exps = logits.map(Math.exp),
    total = exps.reduce((sum, value) => sum + value, 0);
  const probabilities = exps.map((value) => value / total);
  const rewardedMass = probabilities.reduce((sum, value, i) => sum + (REWARDS[i] ? value : 0), 0);
  return {
    logits,
    probabilities,
    rewardedMass,
  };
}
export function arithmeticEvaluation(policyAnswer = EVALUATION_FIXTURE.workedAnswer) {
  const expected = (factors) => factors[0] * factors[1];
  const reward = (factors, answer) => Number(expected(factors) === answer);
  const trainingExpected = expected(EVALUATION_FIXTURE.training.factors);
  const training = {
    factors: EVALUATION_FIXTURE.training.factors,
    expected: trainingExpected,
    initialPolicyAnswer: EVALUATION_FIXTURE.initialAnswer,
    initialReward: reward(EVALUATION_FIXTURE.training.factors, EVALUATION_FIXTURE.initialAnswer),
    policyAnswer,
    reward: reward(EVALUATION_FIXTURE.training.factors, policyAnswer),
  };
  const heldOut = EVALUATION_FIXTURE.heldOut.map(({ factors }) => ({
    factors,
    expected: expected(factors),
    policyAnswer,
    reward: reward(factors, policyAnswer),
  }));
  const checkerChallenge = {
    worked: {
      answer: EVALUATION_FIXTURE.workedAnswer,
      reward: reward(EVALUATION_FIXTURE.training.factors, EVALUATION_FIXTURE.workedAnswer),
    },
    unsupportedGuess: {
      answer: EVALUATION_FIXTURE.unsupportedGuess,
      reward: reward(EVALUATION_FIXTURE.training.factors, EVALUATION_FIXTURE.unsupportedGuess),
    },
  };
  return {
    training,
    heldOut,
    heldOutAccuracy: heldOut.filter((row) => row.reward === 1).length / heldOut.length,
    checkerChallenge,
  };
}
export const vrBound = (v) => Math.max(0, Math.min(1, v));
export const vrLerp = (a, b, p) => a + (b - a) * vrBound(p);
export function rlvrSoftmax(logits) {
  const maximum = Math.max(...logits),
    weights = logits.map((x) => Math.exp(x - maximum)),
    total = weights.reduce((a, b) => a + b, 0);
  return logits.map((_, i) => weights[i] / total);
}
export function rlvrGroupUpdate(rewards, learningRate = 0.1, progress = 1) {
  const stats = groupStatistics(rewards),
    gradient = stats.advantages.map((a) => -a / rewards.length),
    logits = gradient.map((g) => -learningRate * vrBound(progress) * g),
    probabilities = rlvrSoftmax(logits);
  return {
    ...stats,
    rewards,
    gradient,
    logits,
    probabilities,
    expectedReward: probabilities.reduce((s, p, i) => s + p * rewards[i], 0),
  };
}
export function rlvrRepair(stage = 0) {
  const active = freshRecords.filter((row) => stage === 0 || row.status !== 'host-crash');
  const rewards = active.map((row) =>
    row.status === 'completed' ? capacityScore(row.response, freshProduct, stage === 2) : 0,
  );
  return {
    stage,
    rewards,
    ...groupStatistics(rewards),
    quarantined: freshRecords.filter((row) => !active.includes(row)).map((row) => row.id),
    active: active.map((row) => row.id),
  };
}
export function rlvrClipped(ratio, advantage, lower = 0.8, upper = 1.2) {
  const clipped = Math.min(upper, Math.max(lower, ratio)),
    raw = ratio * advantage,
    alternative = clipped * advantage;
  return {
    ratio,
    advantage,
    raw,
    alternative,
    surrogate: Math.min(raw, alternative),
    loss: -Math.min(raw, alternative),
  };
}
export function rlvrReduction(progress = 0) {
  const q = vrBound(progress),
    lengths = [2, 4],
    terms = [2, 0],
    weights = lengths.map((n) => vrLerp(1 / (2 * n), 1 / 6, q)),
    contributions = lengths.map((n, i) => n * terms[i] * weights[i]);
  return {
    lengths,
    terms,
    weights,
    contributions,
    loss: contributions.reduce((a, b) => a + b, 0),
  };
}
export function rlvrKl(theta = Math.log(4)) {
  const p = [1 / (1 + Math.exp(-theta)), 1 / (1 + Math.exp(theta))],
    reference = [0.5, 0.5],
    ell = p.map((v, i) => Math.log(reference[i] / v)),
    sample = ell.map((x) => Math.exp(x) - x - 1),
    full = p.reduce((s, v, i) => s + v * Math.log(v / reference[i]), 0),
    fixed = p[0] - 0.5;
  return {
    p,
    reference,
    ell,
    sample,
    full,
    expectedSample: p.reduce((s, v, i) => s + v * sample[i], 0),
    fullGradient: p[0] * p[1] * theta,
    fixedGradient: fixed,
  };
}
export function rlvrMixedProbability(passProbability, size) {
  assert(passProbability >= 0 && passProbability <= 1);
  assert(Number.isInteger(size) && size > 0);
  return {
    allPass: passProbability ** size,
    allFail: (1 - passProbability) ** size,
    mixed: 1 - passProbability ** size - (1 - passProbability) ** size,
  };
}
export const vrGcd = (a, b) => {
  a = a < 0n ? -a : a;
  while (b) {
    const r = a % b;
    a = b;
    b = r;
  }
  return a;
};
export function rlvrDecimal(text) {
  if (typeof text !== 'string' || !/^-?\d{1,20}(?:\.\d{1,20})?$/.test(text))
    throw Error('bounded decimal string required');
  const sign = text.startsWith('-') ? -1n : 1n,
    parts = text.replace(/^[-+]/, '').split('.'),
    denominator = 10n ** BigInt(parts[1]?.length ?? 0),
    numerator = sign * BigInt(parts[0] + (parts[1] ?? '')),
    g = vrGcd(numerator, denominator);
  return {
    numerator: numerator / g,
    denominator: denominator / g,
  };
}
export function rlvrDecimalCheck(predicted, expected, tolerance = '0') {
  const p = rlvrDecimal(predicted),
    e = rlvrDecimal(expected),
    t = rlvrDecimal(tolerance);
  assert(t.numerator >= 0n);
  const difference = p.numerator * e.denominator - e.numerator * p.denominator,
    absolute = difference < 0n ? -difference : difference;
  return {
    predicted: p,
    expected: e,
    tolerance: t,
    differenceNumerator: absolute,
    differenceDenominator: p.denominator * e.denominator,
    pass: absolute * t.denominator <= t.numerator * p.denominator * e.denominator,
  };
}
