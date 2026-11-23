import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { withRecommendationFocus, recommendationFocusTargets } from './defaults.mjs';
import introStage, { paintIntro } from './stages/intro.mjs';
import eligibilityStage, { paintEligibility } from './stages/eligibility.mjs';
import judgmentContractStage, { paintJudgmentContract } from './stages/judgment-contract.mjs';
import retrievalRecallStage, { paintRetrievalRecall } from './stages/retrieval-recall.mjs';
import rerankingStage, { paintReranking } from './stages/reranking.mjs';
import rankingMetricsStage, { paintRankingMetrics } from './stages/ranking-metrics.mjs';
import judgmentUniverseStage, { paintJudgmentUniverse } from './stages/judgment-universe.mjs';
import reciprocalPrecisionStage, {
  paintReciprocalPrecision,
} from './stages/reciprocal-precision.mjs';
import twoTowerRetrievalStage, { paintTwoTowerRetrieval } from './stages/two-tower-retrieval.mjs';
import towerContractStage, { paintTowerContract } from './stages/tower-contract.mjs';
import crossVectorStage, { paintCrossVector } from './stages/cross-vector.mjs';
import crossMatrixStage, { paintCrossMatrix } from './stages/cross-matrix.mjs';
import generatedOrderStage, { paintGeneratedOrder } from './stages/generated-order.mjs';
import feedColdstartStage, { paintFeedColdstart } from './stages/feed-coldstart.mjs';
import pointwiseTargetStage, { paintPointwiseTarget } from './stages/pointwise-target.mjs';
import pairUpdateStage, { paintPairUpdate } from './stages/pair-update.mjs';
import metricPairStage, { paintMetricPair } from './stages/metric-pair.mjs';
import listwiseContractStage, { paintListwiseContract } from './stages/listwise-contract.mjs';
import positionBiasStage, { paintPositionBias } from './stages/position-bias.mjs';
import anchorClippingStage, { paintAnchorClipping } from './stages/anchor-clipping.mjs';
import coverageExplorationStage, {
  paintCoverageExploration,
} from './stages/coverage-exploration.mjs';
import exposureJoinStage, { paintExposureJoin } from './stages/exposure-join.mjs';
import slatePolicyStage, { paintSlatePolicy } from './stages/slate-policy.mjs';
import policyUnderfillStage, { paintPolicyUnderfill } from './stages/policy-underfill.mjs';
import offlineFixtureGateStage, {
  paintOfflineFixtureGate,
} from './stages/offline-fixture-gate.mjs';
import developerExperimentStage, {
  paintDeveloperExperiment,
} from './stages/developer-experiment.mjs';
import wrapStage, { paintWrap } from './stages/wrap.mjs';
import freshPermissionStage, { paintFreshPermission } from './stages/fresh-permission.mjs';
export { TOWER_OBSERVED } from './fixtures.mjs';
export {
  crossMatrixState,
  crossVectorState,
  developerAggregation,
  eventIntegrity,
  examinationState,
  lambdaPairLedger,
  listDistributionStep,
  metricSwapState,
  rankNetStep,
  reciprocalPrecision,
  sourceIdentity,
} from './arithmetic.mjs';
export {
  eligibilityShown,
  eligibilityStateFor,
  judgedListState,
  permissionTransfer,
  preferredPairs,
  rankingStateFor,
  rerankActors,
  sourceSlate,
  twoTowerConstructionFor,
  validateModel,
} from './model.mjs';
const orderedStages = [
  [introStage, paintIntro],
  [eligibilityStage, paintEligibility],
  [judgmentContractStage, paintJudgmentContract],
  [retrievalRecallStage, paintRetrievalRecall],
  [rerankingStage, paintReranking],
  [rankingMetricsStage, paintRankingMetrics],
  [judgmentUniverseStage, paintJudgmentUniverse],
  [reciprocalPrecisionStage, paintReciprocalPrecision],
  [twoTowerRetrievalStage, paintTwoTowerRetrieval],
  [towerContractStage, paintTowerContract],
  [crossVectorStage, paintCrossVector],
  [crossMatrixStage, paintCrossMatrix],
  [generatedOrderStage, paintGeneratedOrder],
  [feedColdstartStage, paintFeedColdstart],
  [pointwiseTargetStage, paintPointwiseTarget],
  [pairUpdateStage, paintPairUpdate],
  [metricPairStage, paintMetricPair],
  [listwiseContractStage, paintListwiseContract],
  [positionBiasStage, paintPositionBias],
  [anchorClippingStage, paintAnchorClipping],
  [coverageExplorationStage, paintCoverageExploration],
  [exposureJoinStage, paintExposureJoin],
  [slatePolicyStage, paintSlatePolicy],
  [policyUnderfillStage, paintPolicyUnderfill],
  [offlineFixtureGateStage, paintOfflineFixtureGate],
  [developerExperimentStage, paintDeveloperExperiment],
  [wrapStage, paintWrap],
  [freshPermissionStage, paintFreshPermission],
];
const orderedDefinition = defineCanvasLesson({
  id: 'recommendation',
  validateModel,
  scenes: orderedStages.map(([stage]) => stage),
});
const painters = new Map(orderedStages.map(([stage, paint]) => [stage.id, paint]));
export function draw(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () => {
    const paint = painters.get(id);
    if (paint) paint(ctx, scene, state, api, C, b, p, id);
    else throw Error('Unknown recommendation drawing: ' + id);
  });
}
export default Object.freeze({
  ...orderedDefinition,
  draw,
});
