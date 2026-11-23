import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import evidenceScoreStage from './stages/evidence-score.mjs';
import sigmoidStage from './stages/sigmoid.mjs';
import boundaryGeometryStage from './stages/boundary-geometry.mjs';
import logLossStage from './stages/log-loss.mjs';
import bernoulliLikelihoodStage from './stages/bernoulli-likelihood.mjs';
import lossCurvatureStage from './stages/loss-curvature.mjs';
import gradientStage from './stages/gradient.mjs';
import batchGradientStage from './stages/batch-gradient.mjs';
import dataContractStage from './stages/data-contract.mjs';
import learningStage from './stages/learning.mjs';
import separationStage from './stages/separation.mjs';
import boundaryStage from './stages/boundary.mjs';
import confusionStage from './stages/confusion.mjs';
import denominatorsStage from './stages/denominators.mjs';
import harmonicMeanStage from './stages/harmonic-mean.mjs';
import capacityStage from './stages/capacity.mjs';
import calibratedCostStage from './stages/calibrated-cost.mjs';
import rankingStage from './stages/ranking.mjs';
import rareEventPopulationStage from './stages/rare-event-population.mjs';
import apAndTiesStage from './stages/ap-and-ties.mjs';
import rescalingStage from './stages/rescaling.mjs';
import calibrationStage from './stages/calibration.mjs';
import calibrationErrorStage from './stages/calibration-error.mjs';
import calibrationMapsStage from './stages/calibration-maps.mjs';
import multiclassHeadsStage from './stages/multiclass-heads.mjs';
import stableSoftmaxStage from './stages/stable-softmax.mjs';
import marginObjectiveStage from './stages/margin-objective.mjs';
import kernelUncertaintyStage from './stages/kernel-uncertainty.mjs';
import implementationParityStage from './stages/implementation-parity.mjs';
import freshOperatingPointStage from './stages/fresh-operating-point.mjs';
import decisionStage from './stages/decision.mjs';
export {
  logLoss,
  regularizedObjective,
  sigmoid,
  softplus,
  stableDistribution,
} from './arithmetic.mjs';
export {
  auditProbabilities,
  calibrationBins,
  fitSteps,
  fittedWeights,
  multiclassLabels,
  multiclassRows,
  multiclassSteps,
  openingRequest,
  pairEvidence,
  penalizedWeights,
  penaltyFitStates,
  plattFitStates,
  regularizedMinimum,
  training,
  validation,
  validationScores,
} from './fixtures.mjs';
export {
  boundaryGeometry,
  calibrationAudit,
  confusionFrame,
  costForCounts,
  countsAt,
  curvatureFixture,
  expectedPolicy,
  freshPolicyVisibility,
  gpFixture,
  gradientTrajectory,
  harmonicFixture,
  isotonicFixture,
  learningConstruction,
  likelihoodRows,
  marginFixture,
  meanHessian,
  multiclassSnapshot,
  policies,
  policyAt,
  prevalenceFixture,
  probabilityCost,
  rankingMetrics,
  reviewRegionVertices,
  routedValidation,
  sweptValidation,
  validateConstructionModel,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'logistic-regression',
  validateModel,
  scenes: [
    introStage,
    evidenceScoreStage,
    sigmoidStage,
    boundaryGeometryStage,
    logLossStage,
    bernoulliLikelihoodStage,
    lossCurvatureStage,
    gradientStage,
    batchGradientStage,
    dataContractStage,
    learningStage,
    separationStage,
    boundaryStage,
    confusionStage,
    denominatorsStage,
    harmonicMeanStage,
    capacityStage,
    calibratedCostStage,
    rankingStage,
    rareEventPopulationStage,
    apAndTiesStage,
    rescalingStage,
    calibrationStage,
    calibrationErrorStage,
    calibrationMapsStage,
    multiclassHeadsStage,
    stableSoftmaxStage,
    marginObjectiveStage,
    kernelUncertaintyStage,
    implementationParityStage,
    freshOperatingPointStage,
    decisionStage,
  ],
});
export const draw = definition.draw;
export default definition;
