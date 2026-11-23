import assert from 'node:assert/strict';
import {
  betaDensity,
  betaQuantile,
  betaTailProbability,
  betaVariance,
  integrate,
} from '../../../films/bayes/arithmetic.mjs';
import {
  family,
  lastEvaluation,
  observed,
  releasePolicy,
  validationOutcomes,
} from '../../../films/bayes/fixtures.mjs';
import {
  contourData,
  familyTail,
  frozenCountDistribution,
  passingRegion,
  predictiveCountDistribution,
} from '../../../films/bayes/model.mjs';

export { betaDensity, betaVariance, contourData, family, observed, passingRegion, releasePolicy };
export const { rateCutoff, requiredMass } = releasePolicy;
export const base = { a: 2, b: 2 };
export const percent = (number, places = 1) => (number * 100).toFixed(places) + '%';
const summaryCache = new Map();
export function posterior(passes, fails, prior = base) {
  const a = prior.a + passes,
    b = prior.b + fails;
  const key = a + ',' + b;
  if (!summaryCache.has(key)) {
    const tail = betaTailProbability(a, b, rateCutoff);
    summaryCache.set(key, { a, b, mean: a / (a + b), tail, release: tail >= requiredMass });
  }
  return summaryCache.get(key);
}
export function afterCards(n, prior = base) {
  const passes = observed.slice(0, n).filter((row) => row.pass).length;
  return posterior(passes, n - passes, prior);
}
export const ten = afterCards(observed.length);
export const priorMeanWeight = { rate: base.a / (base.a + base.b), weight: base.a + base.b };
export const observedMeanWeight = {
  rate: (ten.a - base.a) / observed.length,
  weight: observed.length,
};
export function meanFromWeights(observedWeight) {
  const prior = priorMeanWeight;
  return (
    (prior.rate * prior.weight + observedMeanWeight.rate * observedWeight) /
    (prior.weight + observedWeight)
  );
}
export const nextPass = posterior(1, 0, ten);
export const nextFail = posterior(0, 1, ten);
export const joint = ten.mean * nextPass.mean;
export const variance = betaVariance(ten.a, ten.b);
export const interval = (model) => [0.05, 0.95].map((q) => betaQuantile(model.a, model.b, q));
export const smallInterval = interval(ten);
export function trialGroups(groups) {
  return { passes: groups * 4, total: groups * 5, model: posterior(groups * 4, groups) };
}
export const largeInterval = interval(trialGroups(20).model);
export const likelihood = (p, s, f) => p ** s * (1 - p) ** f;
export const priorDensity = (p) => betaDensity(base.a, base.b, p);
export const rawProduct = (p) => priorDensity(p) * likelihood(p, ten.a - base.a, ten.b - base.b);
export const sequenceEvidence = integrate(rawProduct);
export const density = (model, p) => betaDensity(model.a, model.b, p);
export const mass = (model, lo, hi) => integrate((p) => density(model, p), lo, hi, 80);
export function tailSweep(model, progress) {
  const end = rateCutoff + (1 - rateCutoff) * progress;
  return {
    end,
    label: progress < 1 ? 'Area collected' : 'Chance above cutoff',
    value: progress === 0 ? null : progress === 1 ? model.tail : mass(model, rateCutoff, end),
  };
}
export const predictionArea = (hi) => integrate((p) => p * density(ten, p), 0, hi, 256);
export const counts = predictiveCountDistribution(5, ten.a, ten.b);
export const fixedCounts = frozenCountDistribution(5, ten.mean);
export const countOrders = Array.from({ length: 5 }, (_, fail) =>
  Array.from({ length: 5 }, (_, i) => i !== fail),
);
export const lastCases = {
  sealed: posterior(lastEvaluation.passes, lastEvaluation.failures, {
    a: lastEvaluation.priorA,
    b: lastEvaluation.priorB,
  }),
};
lastCases.pass = posterior(1, 0, lastCases.sealed);
lastCases.fail = posterior(0, 1, lastCases.sealed);
export const finalInterval = interval(lastCases.fail);
export const previousTasks = Array.from(
  { length: lastEvaluation.passes + lastEvaluation.failures },
  (_, i) => i < lastEvaluation.passes,
);
export function forecastMix(easyShare) {
  return (
    (easyShare * family.easy.a) / (family.easy.a + family.easy.b) +
    ((1 - easyShare) * family.hard.a) / (family.hard.a + family.hard.b)
  );
}
export const mixTails = { benchmark: familyTail(0.8), deployment: familyTail(0.2) };
const binEdges = Array.from({ length: 21 }, (_, i) => familyTail(0.2, i / 20));
export const bins = binEdges.slice(1).map((v, i) => binEdges[i] - v);
let validationPasses = 0;
export const validation = validationOutcomes.map((row, i) => {
  validationPasses += Number(row.pass);
  return { ...row, n: i + 1, passes: validationPasses, fraction: validationPasses / (i + 1) };
});

// The first batch is the frozen forecast from the film. The other three illustrate grouping.
const forecastBatches = [
  { forecast: validation[0].forecast, passes: validation.at(-1).passes, tasks: validation.length },
  { forecast: 24 / 35, passes: 58, tasks: 100 },
  { forecast: 0.48, passes: 54, tasks: 100 },
  { forecast: 0.52, passes: 56, tasks: 100 },
];
function summarizeBatches(batches) {
  const tasks = batches.reduce((sum, batch) => sum + batch.tasks, 0);
  const passes = batches.reduce((sum, batch) => sum + batch.passes, 0);
  const expected = batches.reduce((sum, batch) => sum + batch.forecast * batch.tasks, 0);
  return { batches, tasks, passes, meanForecast: expected / tasks, fraction: passes / tasks };
}
export const forecastGroups = [0.7, 0.5].map((center) => ({
  center,
  ...summarizeBatches(forecastBatches.filter((b) => Math.round(b.forecast * 10) === center * 10)),
}));
export const pooledForecast = summarizeBatches(forecastBatches);

export function check() {
  const near = (got, expected, tol = 1e-7) =>
    assert.ok(Math.abs(got - expected) < tol, got + ' vs ' + expected);
  assert.deepEqual([ten.a, ten.b, ten.release], [10, 4, false]);
  assert.deepEqual(priorMeanWeight, { rate: 0.5, weight: 4 });
  assert.deepEqual(observedMeanWeight, { rate: 0.8, weight: 10 });
  near(meanFromWeights(0), priorMeanWeight.rate);
  near(meanFromWeights(priorMeanWeight.weight), 0.65);
  near(meanFromWeights(observedMeanWeight.weight), ten.mean);
  assert.equal(percent(ten.tail), '57.9%');
  near(mass(ten, rateCutoff, 1), ten.tail);
  const partial = tailSweep(ten, 0.5);
  near(partial.end, 0.85);
  near(partial.value, ten.tail - betaTailProbability(ten.a, ten.b, partial.end));
  assert.deepEqual([tailSweep(ten, 0).value, partial.label, tailSweep(ten, 1).label],
    [null, 'Area collected', 'Chance above cutoff']);
  near(tailSweep(ten, 1).value, ten.tail);
  near(mass(base, 0.6, 0.6), 0);
  near(density(base, 0.6), 1.44);
  assert.equal(likelihood(1, 8, 1), 0);
  near(likelihood(0.8, 8, 2) / likelihood(0.5, 8, 2), 6.8719476736);
  near(sequenceEvidence, 6 / 2860);
  for (const p of [0.2, 0.5, 0.7, 0.8]) near(rawProduct(p) / sequenceEvidence, density(ten, p));
  near(predictionArea(1), ten.mean);
  near(joint - ten.mean ** 2, variance);
  near(nextFail.mean, 10 / 15);
  near(mass(ten, ...smallInterval), 0.9);
  assert.equal(percent(counts[4].probability / countOrders.length), '6.7%');
  near(
    counts.reduce((a, v) => a + v.probability, 0),
    1,
  );
  near(
    counts.reduce((a, v) => a + v.probability * v.passes, 0),
    5 * ten.mean,
  );
  assert.ok(counts[5].probability > fixedCounts[5].probability);
  for (let i = 2; i <= 20; i++) near(trialGroups(i).passes / trialGroups(i).total, 0.8);
  const big = trialGroups(20).model;
  assert.equal(percent(big.tail), '98.1%');
  assert.ok(largeInterval[1] - largeInterval[0] < smallInterval[1] - smallInterval[0]);
  assert.deepEqual(
    [1, 2, 20].map((n) => percent(afterCards(10, { a: n, b: n }).tail)),
    ['68.7%', '57.9%', '1.9%'],
  );
  near(forecastMix(0.2), 0.50952381);
  assert.equal(percent(mixTails.deployment), '0.9%');
  near(
    bins.slice(14).reduce((a, v) => a + v, 0),
    mixTails.deployment,
  );
  assert.equal(validation.at(-1).passes, 72);
  assert.deepEqual(forecastGroups.map((group) => [group.batches.length, group.tasks, group.passes]),
    [[2, 200, 130], [2, 200, 110]]);
  for (const [i, [mean, fraction]] of [[0.7, 0.65], [0.5, 0.55]].entries()) {
    near(forecastGroups[i].meanForecast, mean);
    near(forecastGroups[i].fraction, fraction);
  }
  near(pooledForecast.meanForecast, 0.6);
  near(pooledForecast.fraction, 0.6);
  assert.deepEqual(
    Object.values(lastCases).map((m) => [m.a, m.b, percent(m.tail), m.release]),
    [
      [20, 4, '94.6%', false],
      [21, 4, '95.8%', true],
      [20, 5, '88.9%', false],
    ],
  );
}
