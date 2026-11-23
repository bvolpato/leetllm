import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownClipScene } from './compatibility.mjs';
import openingStage from './stages/opening.mjs';
import towersStage from './stages/towers.mjs';
import cosineStage from './stages/cosine.mjs';
import matrixStage from './stages/matrix.mjs';
import objectiveStage from './stages/objective.mjs';
import trainingStepStage from './stages/training-step.mjs';
import zeroShotStage from './stages/zero-shot.mjs';
import retrievalStage from './stages/retrieval.mjs';
import boundariesStage from './stages/boundaries.mjs';
import inspectionBriefStage from './stages/inspection-brief.mjs';
import dataAndImplementationStage from './stages/data-and-implementation.mjs';
import siglipPairsStage from './stages/siglip-pairs.mjs';
import visualFeaturesStage from './stages/visual-features.mjs';
import projectorTrainingStage from './stages/projector-training.mjs';
import queryBottleneckStage from './stages/query-bottleneck.mjs';
import crossAttentionBankStage from './stages/cross-attention-bank.mjs';
import groundedDetailStage from './stages/grounded-detail.mjs';
import prefixBudgetStage from './stages/prefix-budget.mjs';
import adaptiveReductionStage from './stages/adaptive-reduction.mjs';
import indexServiceStage from './stages/index-service.mjs';
import routeEvaluationStage from './stages/route-evaluation.mjs';
import inspectionTransferStage from './stages/inspection-transfer.mjs';
export {
  CAPTIONS,
  IMAGE_FEATURES,
  IMAGE_NAMES,
  IMAGE_REQUEST,
  PATCH_KV,
  TEMPERATURE,
  TEXT_FEATURES,
  visualPrefix,
} from './fixtures.mjs';
export { pairLogisticLoss, prefixCosts } from './arithmetic.mjs';
export {
  computeClipFixture,
  contrastiveGradient,
  patchAttention,
  reductionDecision,
  workerSchedule,
} from './model.mjs';
export { contrastiveStep, trainingStepFrame } from './training.mjs';
export { towerEncodingState } from './construction.mjs';
export {
  activateImageGeneration,
  cachedImageAllowed,
  imageFingerprint,
  imageLedgerSnapshot,
  ingestImage,
} from './protocols.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'vision-language-clip',
  validateModel,
  scenes: [
    openingStage,
    towersStage,
    cosineStage,
    matrixStage,
    objectiveStage,
    trainingStepStage,
    zeroShotStage,
    retrievalStage,
    boundariesStage,
    inspectionBriefStage,
    dataAndImplementationStage,
    siglipPairsStage,
    visualFeaturesStage,
    projectorTrainingStage,
    queryBottleneckStage,
    crossAttentionBankStage,
    groundedDetailStage,
    prefixBudgetStage,
    adaptiveReductionStage,
    indexServiceStage,
    routeEvaluationStage,
    inspectionTransferStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter ? painter(ctx, scene, state, api) : drawUnknownClipScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
