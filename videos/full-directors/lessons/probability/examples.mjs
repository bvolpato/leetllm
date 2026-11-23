import assert from 'node:assert/strict';
import {
  broad,
  strict,
  population,
  freshQueue,
  changedQueue,
  freshCapacity,
  nextLogits,
  nextProbabilities,
  tokenDraws,
  queuePackets,
} from '../../../films/probability/fixtures.mjs';
import { checkedPosterior, probSoftmax, rng } from '../../../films/probability/arithmetic.mjs';
import { avg, sum } from './press.mjs';

export {
  population,
  freshQueue,
  changedQueue,
  freshCapacity,
  nextLogits,
  nextProbabilities,
  tokenDraws,
  checkedPosterior,
  probSoftmax,
};
export const n = population.abusive + population.clean;
export const prior = population.abusive / n;
export function audit(tp, fp) {
  return {
    tp,
    fp,
    total: tp + fp,
    missed: population.abusive - tp,
    passed: population.clean - fp,
    risk: tp / (tp + fp),
  };
}
export const original = audit(broad.tp, broad.fp);
export const tighter = audit(strict.tp, strict.fp);
export const better = audit(broad.tp, strict.fp);
export const recall = broad.tp / population.abusive;
export const falseRate = broad.fp / population.clean;
export function composition(p, r = recall, f = falseRate) {
  const abuse = n * p,
    clean = n - abuse,
    tp = abuse * r,
    fp = clean * f;
  return { abuse, clean, tp, fp, total: tp + fp, risk: tp / (tp + fp) };
}
export const sameRate = composition(prior, 0.2, 0.2);
export const dual = composition(prior, recall ** 2, falseRate ** 2);
export const copyID = 'C' + String(queuePackets.find((row) => !row.abusive).first).padStart(4, '0');
export const strictDrop = queuePackets.find((row) => row.abusive && !row.kept);
export const tiny = Number.MIN_VALUE;
export const tinyRecall = 0.5;
export const storedAbusiveMass = tiny * tinyRecall;
export const storedCleanMass = (1 - tiny) * tiny;
export const logMass = [Math.log(tiny) + Math.log(tinyRecall), Math.log1p(-tiny) + Math.log(tiny)];
export const relativeMass = logMass.map((v) => Math.exp(v - Math.max(...logMass)));
export const labels = [1, 0, 1];
export const factors = (p) => labels.map((y) => (y ? p : 1 - p));
export const product = (a) => a.reduce((t, v) => t * v, 1);
export const likelihood = (p) => product(factors(p));
export const scores = [0.8, 0.82, 0.78, 0.81, 0.79, 0.8],
  observed = [1, 0, 1, 0, 1, 0];
export const batchLabels = [0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
export function poisson(k, rate) {
  let mass = Math.exp(-rate);
  for (let i = 1; i <= k; i++) mass *= rate / i;
  return mass;
}
export const words = ['result', 'value', 'None', 'banana'];
const uniform = rng(7);
export const draws = [uniform(), uniform()];
export function pick(u) {
  let s = 0;
  for (const [i, p] of nextProbabilities.entries()) {
    s += p;
    if (u < s) return i;
  }
  return nextProbabilities.length - 1;
}
export const phrase = ['rain', 'fell', 'here'],
  conditional = [0.5, 0.2, 0.1];
export const loss = (p) => -Math.log(p);
export const sequenceLoss = avg(conditional.map(loss));
export const models = [
  [0.6, 0.5, 0.7, 0.4],
  [0.25, 0.25, 0.25, 0.25],
  [0.99, 0.99, 0.99, 0.001],
];
export const once = probSoftmax([2, 1, 0]),
  twice = probSoftmax(once);
export const se = (p, n) => Math.sqrt((p * (1 - p)) / n);
function passRates(n) {
  const random = rng(1234);
  return Array.from({ length: 60 }, () => {
    let count = 0;
    for (let i = 0; i < n; i++) count += Number(random() < 0.8);
    return count / n;
  });
}
export const rates50 = passRates(50),
  rates200 = passRates(200);
export const pairs = Array.from({ length: 50 }, (_, i) =>
  i < 39 ? [1, 1] : i < 42 ? [1, 0] : i < 43 ? [0, 1] : [0, 0],
);
export const newPass = sum(pairs.map((pair) => pair[0])),
  oldPass = sum(pairs.map((pair) => pair[1]));
export const difference = (newPass - oldPass) / pairs.length;
export const gapError = Math.hypot(se(newPass / 50, 50), se(oldPass / 50, 50));
export const planning = (gap) => Math.round((8 * 0.8 * 0.2) / gap ** 2);

export function check() {
  const near = (a, b, t = 1e-10) => assert(Math.abs(a - b) < t, a + ' differs from ' + b);
  assert.deepEqual([n, original.total, original.missed, original.passed], [10000, 590, 5, 9405]);
  near(prior, 0.01);
  near(prior * (1 - prior), 0.0099);
  near(original.risk, 95 / 590);
  assert.deepEqual([composition(0.1).tp, composition(0.1).fp], [950, 450]);
  near(sameRate.risk, prior);
  near(dual.risk, 90.25 / 115);
  assert.throws(() => checkedPosterior(1.4, recall, falseRate));
  assert.throws(() => checkedPosterior(prior, 0, 0));
  near(checkedPosterior(tiny, tinyRecall, tiny), 1 / 3);
  near(relativeMass[0], 0.5);
  assert.equal(relativeMass[1], 1);
  assert.equal(tinyRecall, 1 / 2);
  assert.equal(storedAbusiveMass, 0);
  assert.equal(storedCleanMass, tiny);
  near(likelihood(0.2), 0.032);
  near(likelihood(0.8), 0.128);
  near(3 * likelihood(2 / 3), 4 / 9);
  near(avg(scores) - avg(observed), 0.3);
  near(batchLabels.length * prior, 0.1);
  near(poisson(0, 2), Math.exp(-2));
  near(sum(nextProbabilities), 1);
  near(nextProbabilities[0] / nextProbabilities[1], Math.exp(0.8));
  assert.deepEqual(draws.map(pick), tokenDraws.slice(0, 2));
  assert.deepEqual(draws.map(pick), [0, 2]);
  assert.equal(pick(nextProbabilities[0]), 1);
  near(product(conditional), 0.01);
  near(Math.exp(sequenceLoss), 4.64158883, 1e-8);
  assert.equal(0.01 ** 200, 0);
  near(200 * Math.log(0.01), -921.0340372, 1e-6);
  assert.deepEqual(
    models.map((ps) => avg(ps.map(loss)).toFixed(3)),
    ['0.619', '1.386', '1.734'],
  );
  assert(twice[1] > once[1]);
  assert.equal(loss(models[2][3]).toFixed(3), '6.908');
  assert.equal(loss(models[2][0]).toFixed(5), '0.01005');
  near(se(0.8, 50), 2 * se(0.8, 200));
  assert.deepEqual([newPass, oldPass], [42, 40]);
  near(difference, 0.04);
  near(gapError, 0.0767333, 0.00001);
  assert.deepEqual([planning(0.02), planning(0.01)], [3200, 12800]);
  assert.deepEqual([tighter.total, tighter.missed, better.total, better.missed], [179, 20, 194, 5]);
  assert.deepEqual([strictDrop.first, strictDrop.count], [81, better.tp - tighter.tp]);
  assert.deepEqual([freshQueue.tp, freshQueue.fp, freshCapacity - freshQueue.total], [480, 388, 32]);
  assert.deepEqual(
    [changedQueue.fp - freshQueue.fp, changedQueue.total - freshCapacity, changedQueue.missed],
    [97, 65, 120],
  );
}
