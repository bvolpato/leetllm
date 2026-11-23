import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import openingStage from './stages/opening.mjs';
import attentionStage from './stages/attention.mjs';
import mapStage from './stages/map.mjs';
import architecturesStage from './stages/architectures.mjs';
import tensorsStage from './stages/tensors.mjs';
import budgetStage from './stages/budget.mjs';
import rooflineStage from './stages/roofline.mjs';
import largeBudgetStage from './stages/large-budget.mjs';
import modelConfigStage from './stages/model-config.mjs';
import physicalHeadsStage from './stages/physical-heads.mjs';
import tradeoffStage from './stages/tradeoff.mjs';
import poolingFailureStage from './stages/pooling-failure.mjs';
import latentStoreStage from './stages/latent-store.mjs';
import latentScoreStage from './stages/latent-score.mjs';
import positionSplitStage from './stages/position-split.mjs';
import kernelRouteStage from './stages/kernel-route.mjs';
import cacheStepStage from './stages/cache-step.mjs';
import causalRepairStage from './stages/causal-repair.mjs';
import synthesisStage from './stages/synthesis.mjs';
import earnedTransferStage from './stages/earned-transfer.mjs';
export { ATTENTION, chapterModel } from './construction.mjs';
export { HEADS, KV_KEYS, KV_VALUES, QUERY_VECTORS } from './fixtures.mjs';
export { cacheBytes, groupSize, kvGroupForQuery, meanVisible, physicalHeads } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'grouped-query-attention',
  validateModel,
  scenes: [
    openingStage,
    attentionStage,
    mapStage,
    architecturesStage,
    tensorsStage,
    budgetStage,
    rooflineStage,
    largeBudgetStage,
    modelConfigStage,
    physicalHeadsStage,
    tradeoffStage,
    poolingFailureStage,
    latentStoreStage,
    latentScoreStage,
    positionSplitStage,
    kernelRouteStage,
    cacheStepStage,
    causalRepairStage,
    synthesisStage,
    earnedTransferStage,
  ],
});
export const draw = definition.draw;
export default definition;
