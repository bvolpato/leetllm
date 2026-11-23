import {
  evidenceBound,
  gammaDensity,
  reconstructionTrace,
  restrictedModel,
  scalarEncoder,
  varianceObjective,
} from './arithmetic.mjs';
import { VAE_COMPARISON_ROUTES, observations } from './fixtures.mjs';
import {
  boundGeometry,
  firstResponsibilities,
  firstUpdate,
  fitted,
  jensenConstruction,
  likelihoodTraceState,
  priorTransfer,
  responsibilitiesAt50,
  symmetricFit,
  totalVarianceMle,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const g = boundGeometry();
  assert(g.newMean < g.oldMean);
  assert(Math.abs(g.newMean - 47.327) < 0.01);
  assert(
    Math.abs(evidenceBound(observations, g.qOld, restrictedModel(g.oldMean)) - g.oldLikelihood) <
      1e-10,
  );
  assert(g.newLikelihood >= g.oldBoundNew && g.oldBoundNew >= g.oldLikelihood);
  assert(Math.abs(jensenConstruction(1).gap) < 1e-12);
  assert(jensenConstruction(0).gap > 0.25);
  assert(
    priorTransfer(0.25).responsibilities[0] > 0.5 && priorTransfer(0.1).responsibilities[0] < 0.5,
  );
  assert.equal(scalarEncoder().z, 2);
  assert(varianceObjective(1) > varianceObjective(1.25));
  const reconstruction = reconstructionTrace();
  assert.equal(reconstruction.loss, 0.5);
  assert.deepEqual(
    [reconstruction.meanGradient, reconstruction.deviationGradient, reconstruction.weightGradient],
    [-1, -0.5, -2],
  );
  assert.equal(likelihoodTraceState(1, 0).index, 1);
  assert.equal(likelihoodTraceState(2, 0).index, 1);
  assert.equal(likelihoodTraceState(2, 1).index, 8);
  for (let i = 0; i <= 100; i++)
    assert.ok(likelihoodTraceState(2, i / 100).trace.every((point) => Number.isInteger(point.x)));
  assert.ok(Math.abs(responsibilitiesAt50[0] - 0.8175744762) < 1e-9);
  assert.ok(Math.abs(responsibilitiesAt50[1] - 0.1824255238) < 1e-9);
  assert.ok(
    firstResponsibilities.every((row) => Math.abs(row.reduce((a, v) => a + v, 0) - 1) < 1e-12),
  );
  assert.ok(firstUpdate.weights.every((v) => v > 0 && v < 1));
  assert.ok(Math.abs(firstUpdate.weights.reduce((a, v) => a + v, 0) - 1) < 1e-12);
  assert.ok(fitted.history.every((v, i) => i === 0 || v >= fitted.history[i - 1] - 1e-10));
  assert.ok(Math.abs(fitted.history[0] - -29.62) < 0.001);
  assert.ok(Math.abs(fitted.history[1] - -27.056) < 0.001);
  assert.ok(Math.abs(fitted.history[8] - -17.694) < 0.001);
  assert.ok(
    Math.abs(fitted.model.means[0] - 30) < 1e-8 && Math.abs(fitted.model.means[1] - 90) < 1e-8,
  );
  assert.ok(Math.abs(fitted.model.variances[0] - 8 / 3) < 1e-8);
  assert.ok(Math.abs(fitted.model.variances[1] - 32 / 3) < 1e-8);
  assert.ok(Math.abs(totalVarianceMle - 906.6666666667) < 1e-8);
  assert.ok(
    Math.abs(symmetricFit.model.means[0] - 60) < 1e-8 &&
      Math.abs(symmetricFit.model.means[1] - 60) < 1e-8,
  );
  assert.ok(Math.abs(symmetricFit.model.variances[0] - totalVarianceMle) < 1e-8);
  assert(gammaDensity(28, 28, 0.04) > gammaDensity(28, 28, 1));
  const priorEvidence = [0.1 * gammaDensity(50, 30, 400), 0.9 * gammaDensity(50, 90, 400)];
  assert(Math.abs(priorEvidence[0] / priorEvidence.reduce((a, v) => a + v, 0) - 0.33242786) < 1e-6);
  assert.deepEqual(
    VAE_COMPARISON_ROUTES.map((route) => [route.posterior, route.update]),
    [
      ['exact', 'm-step'],
      ['encoder', 'elbo-gradient'],
    ],
  );
  assert.equal(new Set(VAE_COMPARISON_ROUTES.map((route) => route.update)).size, 2);
  return true;
}
