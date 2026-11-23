import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnrecognizedScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import funnelContractStage from './stages/funnel-contract.mjs';
import eligibilityStage from './stages/eligibility.mjs';
import slateRecheckStage from './stages/slate-recheck.mjs';
import orderingStage from './stages/ordering.mjs';
import metricContractsStage from './stages/metric-contracts.mjs';
import recallStage from './stages/recall.mjs';
import offlineGatesStage from './stages/offline-gates.mjs';
import pairwiseStage from './stages/pairwise.mjs';
import pairwiseObjectiveStage from './stages/pairwise-objective.mjs';
import trainingMatrixStage from './stages/training-matrix.mjs';
import timeStage from './stages/time.mjs';
import temporalProtocolStage from './stages/temporal-protocol.mjs';
import trainedModelStage from './stages/trained-model.mjs';
import exposureStage from './stages/exposure.mjs';
import clickModelStage from './stages/click-model.mjs';
import propensityContractStage from './stages/propensity-contract.mjs';
import synthesisStage from './stages/synthesis.mjs';
import responseLineageStage from './stages/response-lineage.mjs';
import outcomeJoinStage from './stages/outcome-join.mjs';
import experimentContractStage from './stages/experiment-contract.mjs';
import probabilityValueStage from './stages/probability-value.mjs';
import onlineGuardrailsStage from './stages/online-guardrails.mjs';
import receiptBoundaryStage from './stages/receipt-boundary.mjs';
import freshRankingStage from './stages/fresh-ranking.mjs';
export { dcg } from './arithmetic.mjs';
export { ORDERING_PRODUCTS } from './fixtures.mjs';
export { TRAINING_PAIRS } from './training-data.mjs';
export {
  buildCurrentSlate,
  diversifiedPair,
  evaluatedRanking,
  exposureFrame,
  fitPairwise,
  meanPairGradient,
  rankingResponse,
  relevantRecall,
  update,
  weightedClickExpectation,
} from './model.mjs';
export { orderingFrame, pairGradientPrefix, recallSnapshot, sampleModel } from './construction.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'capstone-product-ranking-recommendation',
  validateModel,
  scenes: [
    introStage,
    funnelContractStage,
    eligibilityStage,
    slateRecheckStage,
    orderingStage,
    metricContractsStage,
    recallStage,
    offlineGatesStage,
    pairwiseStage,
    pairwiseObjectiveStage,
    trainingMatrixStage,
    timeStage,
    temporalProtocolStage,
    trainedModelStage,
    exposureStage,
    clickModelStage,
    propensityContractStage,
    synthesisStage,
    responseLineageStage,
    outcomeJoinStage,
    experimentContractStage,
    probabilityValueStage,
    onlineGuardrailsStage,
    receiptBoundaryStage,
    freshRankingStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
