import { drawFallback } from './fallback.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import featureClocksStage from './stages/feature-clocks.mjs';
import fitStage from './stages/fit.mjs';
import bundleStage from './stages/bundle.mjs';
import strictModelLoaderStage from './stages/strict-model-loader.mjs';
import offlineStage from './stages/offline.mjs';
import boundEvidenceStage from './stages/bound-evidence.mjs';
import canaryStage from './stages/canary.mjs';
import canaryWindowContractStage from './stages/canary-window-contract.mjs';
import promotionStage from './stages/promotion.mjs';
import aliasGenerationStage from './stages/alias-generation.mjs';
import recoveryStage from './stages/recovery.mjs';
import productionHistoryStage from './stages/production-history.mjs';
import productMonitoringStage from './stages/product-monitoring.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshStaleReceiptStage from './stages/fresh-stale-receipt.mjs';
export { canary, fit, matureQuality, score } from './arithmetic.mjs';
export { canaryEvidence, offlineConstruction, sampleModel } from './construction.mjs';
export { CANARY_EVIDENCE_CUES, HAND_FAIL, OFFLINE_CASES, RETAINED_RELEASES } from './fixtures.mjs';
export {
  admittedFeature,
  evaluatePackage,
  freshPipelineState,
  loadRelease,
  offline,
  offlineReceipt,
  pipelineOffline,
  pipelinePromotionDecision,
  pipelinePromotionFixture,
  probeRelease,
  promotionTarget,
  receiptMatches,
} from './model.mjs';
export { validateModel, validatePipelineUpgrade } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'capstone-production-ml-pipeline',
  validateModel,
  scenes: [
    introStage,
    featureClocksStage,
    fitStage,
    bundleStage,
    strictModelLoaderStage,
    offlineStage,
    boundEvidenceStage,
    canaryStage,
    canaryWindowContractStage,
    promotionStage,
    aliasGenerationStage,
    recoveryStage,
    productionHistoryStage,
    productMonitoringStage,
    synthesisStage,
    freshStaleReceiptStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  return api.focus.target(scene.id + '-mechanism', () => {
    const painter = stageDraws.get(scene.id) ?? drawFallback;
    painter(ctx, scene, state, api);
  });
}
export default Object.freeze({
  ...definition,
  draw,
});
