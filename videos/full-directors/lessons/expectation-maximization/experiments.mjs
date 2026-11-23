import assert from 'node:assert/strict';
import { afterCue, cue, mix, total } from './drawing.mjs';
import {
  observations as data,
  initialModel as start,
} from '../../../films/expectation-maximization/fixtures.mjs';
import {
  gammaDensity as normal,
  mixtureDensity,
  logLikelihood,
  restrictedModel,
  evidenceBound,
  mStep,
  posterior,
  reconstructionTrace,
  varianceObjective,
} from '../../../films/expectation-maximization/arithmetic.mjs';
import {
  firstResponsibilities as shares,
  firstUpdate as update,
  fitted,
  symmetricFit,
  boundGeometry,
  jensenConstruction,
  totalVarianceMle,
  membershipAt,
} from '../../../films/expectation-maximization/model.mjs';

export {
  data,
  start,
  normal,
  mixtureDensity,
  logLikelihood,
  restrictedModel,
  evidenceBound,
  shares,
  update,
  fitted,
  symmetricFit,
  jensenConstruction,
  membershipAt,
  totalVarianceMle,
  varianceObjective,
  reconstructionTrace,
};
export const jars = [
  [true, false, true, true],
  [false, true, false, false],
];
export const stripes = jars.map((j) => j.filter(Boolean).length);
export const cohortSizes = [25, 75];
export const hitRate = 0.6;
export const refreshedShares = posterior(data, update);
export const observedHit = true;
export const validation = [29, 31, 88, 92];
export const bound = boundGeometry();
function boundWithGap(bound, gap) {
  return { bound, gap, logEvidence: bound + gap };
}
const reconstruction = -5.2;
const priorPenalty = 0.8;
export const klExample = {
  reconstruction,
  priorPenalty,
  ...boundWithGap(reconstruction - priorPenalty, 1.5),
};
export const vaeFits = [boundWithGap(-10, 3), boundWithGap(-9, 1)];
export const pooled = (x) => normal(x, 60, totalVarianceMle);
export const broadContribution = (x) => 0.5 * normal(x, 90, 900);
export const twoPeaks = (x) => mixtureDensity(x, fitted.model);
export const averageLog = (model) => logLikelihood(validation, model) / validation.length;
export function mass(fn, lo = 50, hi = 70) {
  const n = 2000,
    dx = (hi - lo) / n;
  return total(Array.from({ length: n }, (_, i) => dx * fn(lo + (i + 0.5) * dx)));
}
export const bandMass = [mass(pooled), mass(twoPeaks)];
export const weightedTimes = (k) => data.map((x, i) => x * shares[i][k]);
export const squaredContributions = data.map((x, i) => shares[i][0] * (x - update.means[0]) ** 2);
export const trajectory = [start];
for (let i = 0; i < 8; i++) trajectory.push(mStep(data, posterior(data, trajectory.at(-1))));
export const displayScore = (model) => logLikelihood(data, model);
export const expScores = [-1000, -1002];
export function stable(scores) {
  if (scores.every((s) => s === -Infinity)) return null;
  const max = Math.max(...scores),
    weights = scores.map((s) => Math.exp(s - max));
  const sum = total(weights);
  return { max, weights, shares: weights.map((w) => w / sum), logTotal: max + Math.log(sum) };
}
export function oddsState(clock, transfer = false) {
  const first = transfer ? 3 : 1;
  const switchOdds = cue(
    clock,
    4,
    transfer ? 'nine slow components' : 'one fast draw for every nine',
  );
  const odds = switchOdds ? 9 : first;
  const model = transfer
    ? membershipAt(45, [20, 80], 15, 1 / (1 + odds))
    : membershipAt(50, [30, 90], 20, 1 / (1 + odds));
  const showOdds = transfer
    ? cue(clock, 2, 'three slow components')
    : cue(clock, 2, 'equally often');
  const answer = switchOdds
    ? cue(clock, 5, transfer ? 'fast component now gets' : 'combined length takes')
    : cue(clock, 3, 'fast component gets about');
  const result = Boolean(answer);
  const traceOpen = transfer && Boolean(cue(clock, 7, 'Open its trace'));
  const trace = traceOpen && cue(clock, 7, 'cache status reads hit') ? observedHit : null;
  return { model, odds, showOdds, result, traceOpen, trace, ratio: model.densities[0] / model.densities[1] };
}
export function mState(clock) {
  const f = afterCue(clock, 2, 'about thirty-five milliseconds', 0.5);
  const s = afterCue(clock, 2, 'about eighty-five', 0.5);
  const v = cue(clock, 3, 'These weights and spreads', 0.9);
  return {
    means: [mix(start.means[0], update.means[0], f), mix(start.means[1], update.means[1], s)],
    variances: start.variances.map((n, k) => mix(n, update.variances[k], v)),
    weights: start.weights.map((n, k) => mix(n, update.weights[k], v)),
    effective: update.effective,
  };
}
export function boundsAt(clock) {
  const move = cue(clock, 3, 'Slide the mean', 2.0);
  const mean = mix(bound.oldMean, bound.newMean, move);
  const refreshed = Boolean(cue(clock, 6, 'Recompute the six bars'));
  const q = refreshed ? bound.qNew : bound.qOld;
  const model = restrictedModel(mean);
  return {
    mean,
    q,
    refreshed,
    likelihood: logLikelihood(data, model),
    lower: evidenceBound(data, q, model),
  };
}
export function nearLimit(clock) {
  const tie = Boolean(cue(clock, 3, 'at sixty'));
  const width = tie
    ? mix(20, 2, cue(clock, 3, 'Shrink both spreads', 1.6))
    : mix(20, 2, cue(clock, 1, 'Bring both spreads', 2));
  const prior = cue(clock, 3, 'one quarter of the prior weight') ? 0.25 : 0.5,
    x = tie ? 60 : 50;
  const params = {
    means: [30, 90],
    weights: [prior, 1 - prior],
    variances: [width ** 2, width ** 2],
  };
  return { x, width, params, tie, r: posterior([x], params)[0][0] };
}
export function nestedModel(t) {
  const { means, variances, weights } = fitted.model;
  return {
    means: [means[0], means[0], means[1]],
    variances: [variances[0], variances[0], variances[1]],
    weights: [weights[0] * (1 - t / 2), (weights[0] * t) / 2, weights[1]],
  };
}
export function check() {
  const close = (a, b, eps = 1e-7) => assert.ok(Math.abs(a - b) < eps, a + ' differs from ' + b);
  assert.deepEqual(stripes, [3, 1]);
  assert.deepEqual(
    cohortSizes.map((size) => size * hitRate),
    [15, 45],
  );
  close(refreshedShares[0][0], 0.994, 0.003);
  for (const row of refreshedShares) close(total(row), 1);
  close(stripes[0] / total(stripes), 0.75);
  assert.deepEqual(data, [28, 30, 32, 86, 90, 94]);
  close(total(data) / 6, 60);
  for (const row of shares) close(total(row), 1);
  for (let k = 0; k < 2; k++) {
    close(update.effective[k], total(shares.map((r) => r[k])));
    close(update.means[k], total(weightedTimes(k)) / update.effective[k]);
    close(update.weights[k], update.effective[k] / 6);
  }
  close(total(squaredContributions) / update.effective[0], update.variances[0]);
  assert.ok(shares[5][0] < 0.07 && squaredContributions[5] > 200);
  const snap = (beat, phrases = []) => ({
    beat: { beatIndex: beat - 1 },
    reveal: (p) => Number(phrases.includes(p)),
  });
  for (const transfer of [false, true]) {
    const x = transfer ? 45 : 50,
      prior = transfer ? 0.25 : 0.5;
    const prediction = oddsState(snap(2), transfer);
    const before = oddsState(snap(4), transfer),
      flipped = oddsState(
        snap(4, [transfer ? 'nine slow components' : 'one fast draw for every nine']),
        transfer,
      );
    const answer = oddsState(snap(6), transfer);
    assert.equal(prediction.result, false);
    assert.equal(before.result, true);
    assert.equal(flipped.result, false);
    for (const s of [before, flipped, answer]) {
      assert.equal(s.model.x, x);
      assert.equal(s.traceOpen, false);
      assert.equal(s.trace, null);
      close(s.ratio / (s.ratio + s.odds), s.model.responsibilities[0]);
    }
    close(before.model.prior, prior);
    close(flipped.model.prior, 0.1);
    assert.equal(answer.result, true);
    close(before.model.responsibilities[0], transfer ? 0.5584 : 0.8176, 0.001);
    close(answer.model.responsibilities[0], transfer ? 0.2965 : 0.3324, 0.001);
    if (transfer) {
      const opened = oddsState(snap(7, ['Open its trace']), true);
      const read = oddsState(snap(7, ['Open its trace', 'cache status reads hit']), true);
      assert.equal(opened.traceOpen, true);
      assert.equal(opened.trace, null);
      assert.equal(read.trace, true);
      assert.deepEqual(opened.model, answer.model);
      assert.deepEqual(read.model, answer.model);
    }
  }
  assert.deepEqual(mState(snap(1)).means, start.means);
  close(mState(snap(5)).means[0], 35.33969, 0.00001);
  close(mState(snap(5)).means[1], 84.73962, 0.00001);
  close(nearLimit(snap(4)).r, 0.25);
  for (const phrases of [['at sixty'], ['at sixty', 'one quarter of the prior weight']]) {
    const tie = nearLimit(snap(3, phrases));
    assert.equal(tie.x, 60);
    close(tie.r, tie.params.weights[0]);
  }
  close(jensenConstruction(0).gap, 0.258, 0.001);
  close(jensenConstruction(1).gap, 0);
  const old = boundsAt(snap(1)),
    moved = boundsAt(snap(5)),
    refreshed = boundsAt(snap(7));
  close(old.likelihood, old.lower);
  close(moved.mean, 47.326864, 1e-5);
  assert.deepEqual(old.q, moved.q);
  close(refreshed.likelihood, moved.likelihood);
  assert.ok(moved.likelihood >= moved.lower && moved.lower >= old.lower);
  close(refreshed.lower, refreshed.likelihood);
  close(refreshed.q[3][0], 0.135, 0.01);
  trajectory.forEach((model, i) => close(displayScore(model), fitted.history[i]));
  for (let i = 1; i < trajectory.length; i++)
    assert.ok(fitted.history[i] >= fitted.history[i - 1] - 1e-10);
  assert.deepEqual(expScores.map(Math.exp), [0, 0]);
  close(stable(expScores).shares[0], 0.880797, 1e-6);
  assert.equal(stable([-Infinity, -Infinity]), null);
  assert.throws(
    () =>
      mStep(
        data,
        data.map(() => [1, 0]),
      ),
    /empty/,
  );
  assert.ok(varianceObjective(1) > varianceObjective(1.25));
  assert.deepEqual(data.slice(1).map(x => broadContribution(x).toFixed(6)),
    ['0.000900', '0.001026', '0.006590', '0.006649', '0.006590']);
  close(symmetricFit.model.means[0], 60);
  close(symmetricFit.model.variances[1], totalVarianceMle);
  const symmetric = symmetricFit.model;
  const next = mStep(data, posterior(data, symmetric));
  for (const key of ['means', 'variances', 'weights']) {
    next[key].forEach((value, k) => close(value, symmetric[key][k]));
  }
  assert.ok(displayScore(fitted.model) > displayScore(symmetric));
  close(averageLog(fitted.model), -2.636, 0.01);
  close(averageLog(symmetricFit.model), -4.82, 0.01);
  for (const x of [...data, ...validation]) close(mixtureDensity(x, nestedModel(1)), twoPeaks(x));
  close(bandMass[0], 0.26, 0.002);
  assert.ok(bandMass[1] < 1e-6);
  close(klExample.bound, -6);
  close(klExample.logEvidence, -4.5);
  const [firstFit, nextFit] = vaeFits;
  close(firstFit.logEvidence, -7);
  close(nextFit.logEvidence, -8);
  close(nextFit.logEvidence - firstFit.logEvidence, -1);
  const tr = reconstructionTrace();
  assert.deepEqual(
    [tr.z, tr.loss, tr.meanGradient, tr.deviationGradient, tr.weightGradient],
    [2, 0.5, -1, -0.5, -2],
  );
  close(reconstructionTrace(1.1).z, 2.1);
  close(reconstructionTrace(1, 2.1).z, 2.05);
}
