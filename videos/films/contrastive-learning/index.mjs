import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { rejectUnknownConstruction } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import orderCollisionStage from './stages/order-collision.mjs';
import encodeStage from './stages/encode.mjs';
import poolingTensorStage from './stages/pooling-tensor.mjs';
import scoresStage from './stages/scores.mjs';
import objectiveStage from './stages/objective.mjs';
import lossNumericsStage from './stages/loss-numerics.mjs';
import tripletMarginStage from './stages/triplet-margin.mjs';
import temperatureGradientStage from './stages/temperature-gradient.mjs';
import geometryStage from './stages/geometry.mjs';
import alignmentUniformityStage from './stages/alignment-uniformity.mjs';
import pairSupervisionStage from './stages/pair-supervision.mjs';
import dropoutViewsStage from './stages/dropout-views.mjs';
import negativesStage from './stages/negatives.mjs';
import batchIdentityStage from './stages/batch-identity.mjs';
import falseNegativesStage from './stages/false-negatives.mjs';
import multiplePositivesStage from './stages/multiple-positives.mjs';
import miningLoopStage from './stages/mining-loop.mjs';
import teacherMarginStage from './stages/teacher-margin.mjs';
import architecturesStage from './stages/architectures.mjs';
import maxsimReadoutStage from './stages/maxsim-readout.mjs';
import taskFormatStage from './stages/task-format.mjs';
import prefixFailureStage from './stages/prefix-failure.mjs';
import nestedLossStage from './stages/nested-loss.mjs';
import retrievalStage from './stages/retrieval.mjs';
import shortlistBudgetStage from './stages/shortlist-budget.mjs';
import evaluationScopeStage from './stages/evaluation-scope.mjs';
import releaseMetricsStage from './stages/release-metrics.mjs';
import transferStage from './stages/transfer.mjs';
import freshEmbeddingStage from './stages/fresh-embedding.mjs';
export { ANGLES, MINING_FIXTURE, NESTED_D, NESTED_Q, START, TAU } from './fixtures.mjs';
export {
  comparisonRow,
  evaluate,
  finiteUnit,
  maskedMean,
  miningCandidates,
  nestedLoss,
  shortlistMetrics,
  steps,
  tokenMaxSim,
  vector,
} from './arithmetic.mjs';
export {
  denominatorSnapshot,
  negativePoolSnapshot,
  scoreTemperature,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'contrastive-learning',
  validateModel,
  scenes: [
    introStage,
    orderCollisionStage,
    encodeStage,
    poolingTensorStage,
    scoresStage,
    objectiveStage,
    lossNumericsStage,
    tripletMarginStage,
    temperatureGradientStage,
    geometryStage,
    alignmentUniformityStage,
    pairSupervisionStage,
    dropoutViewsStage,
    negativesStage,
    batchIdentityStage,
    falseNegativesStage,
    multiplePositivesStage,
    miningLoopStage,
    teacherMarginStage,
    architecturesStage,
    maxsimReadoutStage,
    taskFormatStage,
    prefixFailureStage,
    nestedLossStage,
    retrievalStage,
    shortlistBudgetStage,
    evaluationScopeStage,
    releaseMetricsStage,
    transferStage,
    freshEmbeddingStage,
  ],
});
const stages = new Map(orderedDefinition.scenes.map((stage) => [stage.id, stage]));
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage
    ? stage.draw(ctx, scene, state, api)
    : rejectUnknownConstruction(ctx, scene, state, api);
}
export default Object.freeze({
  ...orderedDefinition,
  draw,
});
