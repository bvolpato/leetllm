import {
  evidenceBound,
  gammaDensity,
  logLikelihood,
  mStep,
  posterior,
  restrictedModel,
} from './arithmetic.mjs';
import { initialModel, observations } from './fixtures.mjs';
export const responsibilitiesAt50 = (() => {
  const contribution = [0, 1].map((k) => 0.5 * gammaDensity(50, [30, 90][k], 400));
  return contribution.map((v) => v / contribution.reduce((sum, q) => sum + q, 0));
})();
export function fitMixture(startMeans, iterations = 8, varianceFloor = 1) {
  let model = {
    weights: startMeans.map(() => 1 / startMeans.length),
    means: [...startMeans],
    variances: startMeans.map(() => 900),
  };
  const history = [logLikelihood(observations, model)];
  for (let i = 0; i < iterations; i++) {
    model = mStep(observations, posterior(observations, model), varianceFloor);
    history.push(logLikelihood(observations, model));
  }
  return {
    model,
    history,
  };
}
export const firstResponsibilities = posterior(observations, initialModel);
export const firstUpdate = mStep(observations, firstResponsibilities);
export const fitted = fitMixture([25, 95]);
export const symmetricFit = fitMixture([60, 60]);
export function boundGeometry() {
  const oldMean = 70,
    oldModel = restrictedModel(oldMean),
    qOld = posterior(observations, oldModel),
    count = qOld.reduce((s, r) => s + r[0], 0),
    numerator = observations.reduce((s, x, i) => s + x * qOld[i][0], 0),
    newMean = numerator / count,
    newModel = restrictedModel(newMean),
    qNew = posterior(observations, newModel);
  return {
    oldMean,
    newMean,
    count,
    numerator,
    qOld,
    qNew,
    oldLikelihood: logLikelihood(observations, oldModel),
    oldBoundNew: evidenceBound(observations, qOld, newModel),
    newLikelihood: logLikelihood(observations, newModel),
  };
}
export function jensenConstruction(progress = 0) {
  const joint = [0.5 * gammaDensity(50, 30, 400), 0.5 * gammaDensity(50, 90, 400)],
    total = joint.reduce((s, v) => s + v, 0),
    q = joint.map((v) => 0.5 + (v / total - 0.5) * progress),
    ratios = joint.map((v, i) => v / q[i]),
    bound = q.reduce((s, v, i) => s + v * Math.log(ratios[i]), 0);
  return {
    joint,
    total,
    q,
    ratios,
    bound,
    logEvidence: Math.log(total),
    gap: Math.log(total) - bound,
  };
}
export function membershipAt(x, means, deviation, prior) {
  const densities = means.map((mu) => gammaDensity(x, mu, deviation ** 2)),
    contributions = densities.map((v, i) => v * (i ? 1 - prior : prior)),
    total = contributions.reduce((s, v) => s + v, 0);
  return {
    x,
    means,
    deviation,
    prior,
    densities,
    contributions,
    total,
    responsibilities: contributions.map((v) => v / total),
  };
}
export function priorTransfer(prior = 0.25) {
  return membershipAt(45, [20, 80], 15, prior);
}
export const totalVarianceMle =
  observations.reduce(
    (sum, x) => sum + (x - observations.reduce((a, v) => a + v, 0) / observations.length) ** 2,
    0,
  ) / observations.length;
export function likelihoodTraceState(beat, progress) {
  const p = Math.max(0, Math.min(1, progress)),
    index = beat === 0 ? Math.floor(p + 1e-9) : beat === 1 ? 1 : 1 + Math.floor(7 * p + 1e-9);
  return {
    index,
    trace: fitted.history.slice(0, index + 1).map((y, x) => ({
      x,
      y,
    })),
  };
}
