import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import tailStage from './stages/tail.mjs';
import dispatchStage from './stages/dispatch.mjs';
import hiddenStage from './stages/hidden.mjs';
import epsilonStage from './stages/epsilon.mjs';
import trafficStage from './stages/traffic.mjs';
import promotionStage from './stages/promotion.mjs';
import domainContractStage from './stages/domain-contract.mjs';
import libraryBoundaryStage from './stages/library-boundary.mjs';
import ownershipAuditStage from './stages/ownership-audit.mjs';
import tolerancePolicyStage from './stages/tolerance-policy.mjs';
import overflowOracleStage from './stages/overflow-oracle.mjs';
import addressOrderStage from './stages/address-order.mjs';
import buildResourcesStage from './stages/build-resources.mjs';
import safetyToolsStage from './stages/safety-tools.mjs';
import timingClocksStage from './stages/timing-clocks.mjs';
import rooflineModelStage from './stages/roofline-model.mjs';
import publicRefinementStage from './stages/public-refinement.mjs';
import benchmarkBoundariesStage from './stages/benchmark-boundaries.mjs';
import checkerMutationsStage from './stages/checker-mutations.mjs';
import shadowBudgetStage from './stages/shadow-budget.mjs';
import canaryEvidenceStage from './stages/canary-evidence.mjs';
import receiptBindingStage from './stages/receipt-binding.mjs';
import freshPromotionStage from './stages/fresh-promotion.mjs';
import { KERNEL_CHAPTERS } from './fixtures.mjs';
import { rejectUnknownKernelChapter } from './compatibility.mjs';
export { KERNEL_CHAPTERS, gappedRows } from './fixtures.mjs';
export {
  binaryAddress,
  cacheLineReads,
  dispatch,
  executeHostKernelCase,
  freshPromotion,
  hostTensorRow,
  isolatedCommand,
  layoutDispatch,
  rms,
  scoreFastP,
  tolerance,
  validEpsilon,
  warpSectors,
} from './arithmetic.mjs';
export {
  hiddenCaseSnapshot,
  introConstruction,
  kernelChapterFrame,
  sampleModel,
} from './construction.mjs';
export { validateModel } from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'ai-generated-kernel-engineering',
  validateModel,
  scenes: [
    introStage,
    domainContractStage,
    dispatchStage,
    hiddenStage,
    tailStage,
    epsilonStage,
    tolerancePolicyStage,
    overflowOracleStage,
    ownershipAuditStage,
    libraryBoundaryStage,
    buildResourcesStage,
    addressOrderStage,
    safetyToolsStage,
    timingClocksStage,
    trafficStage,
    rooflineModelStage,
    publicRefinementStage,
    benchmarkBoundariesStage,
    checkerMutationsStage,
    shadowBudgetStage,
    canaryEvidenceStage,
    promotionStage,
    receiptBindingStage,
    freshPromotionStage,
  ],
});
const originalStages = new Map([
  ['intro', introStage],
  ['tail', tailStage],
  ['dispatch', dispatchStage],
  ['hidden', hiddenStage],
  ['epsilon', epsilonStage],
  ['traffic', trafficStage],
  ['promotion', promotionStage],
]);
const chapterStages = new Map([
  ['domain-contract', domainContractStage],
  ['library-boundary', libraryBoundaryStage],
  ['ownership-audit', ownershipAuditStage],
  ['tolerance-policy', tolerancePolicyStage],
  ['overflow-oracle', overflowOracleStage],
  ['address-order', addressOrderStage],
  ['build-resources', buildResourcesStage],
  ['safety-tools', safetyToolsStage],
  ['timing-clocks', timingClocksStage],
  ['roofline-model', rooflineModelStage],
  ['public-refinement', publicRefinementStage],
  ['benchmark-boundaries', benchmarkBoundariesStage],
  ['checker-mutations', checkerMutationsStage],
  ['shadow-budget', shadowBudgetStage],
  ['canary-evidence', canaryEvidenceStage],
  ['receipt-binding', receiptBindingStage],
  ['fresh-promotion', freshPromotionStage],
]);
export function draw(ctx, scene, state, api) {
  if (KERNEL_CHAPTERS.has(scene.id)) {
    const stage = chapterStages.get(scene.id);
    return stage
      ? stage.draw(ctx, scene, state, api)
      : rejectUnknownKernelChapter(ctx, scene, state, api);
  }
  const stage = originalStages.get(scene.id) ?? promotionStage;
  return stage.draw(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;
