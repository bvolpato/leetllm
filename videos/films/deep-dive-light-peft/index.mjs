import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { rejectUnknownScene } from './compatibility.mjs';
import openingStage from './stages/opening.mjs';
import parallelProductStage from './stages/parallel-product.mjs';
import executionGradientStage from './stages/execution-gradient.mjs';
import costStage from './stages/cost.mjs';
import quantizedVersusSlicedStage from './stages/quantized-versus-sliced.mjs';
import sourceBoundaryStage from './stages/source-boundary.mjs';
import receiptIdentityStage from './stages/receipt-identity.mjs';
import handoffStage from './stages/handoff.mjs';
import maskGradientStage from './stages/mask-gradient.mjs';
import headsStage from './stages/heads.mjs';
import signedGatesStage from './stages/signed-gates.mjs';
import ffnStage from './stages/ffn.mjs';
import globalVersusLocalStage from './stages/global-versus-local.mjs';
import thresholdBoundariesStage from './stages/threshold-boundaries.mjs';
import moduleRatioStage from './stages/module-ratio.mjs';
import historySanitizationStage from './stages/history-sanitization.mjs';
import adapterStage from './stages/adapter.mjs';
import rankDerivativeStage from './stages/rank-derivative.mjs';
import pairedProductStage from './stages/paired-product.mjs';
import preservedScaleStage from './stages/preserved-scale.mjs';
import physicalHandoffStage from './stages/physical-handoff.mjs';
import continuationResetStage from './stages/continuation-reset.mjs';
import artifactDiagnosisStage from './stages/artifact-diagnosis.mjs';
import completeStopwatchStage from './stages/complete-stopwatch.mjs';
import evidenceStage from './stages/evidence.mjs';
import paperTradeoffStage from './stages/paper-tradeoff.mjs';
import paperMemoryStage from './stages/paper-memory.mjs';
import paperInferenceStage from './stages/paper-inference.mjs';
import randomControlStage from './stages/random-control.mjs';
import deploymentStage from './stages/deployment.mjs';
import sameWidthOutputStage from './stages/same-width-output.mjs';
import sharedFleetStage from './stages/shared-fleet.mjs';
import shiftGateStage from './stages/shift-gate.mjs';
import runtimeLayoutStage from './stages/runtime-layout.mjs';
import freshPruningStage from './stages/fresh-pruning.mjs';
export { keepAbove, quantile } from './arithmetic.mjs';
export {
  adapterConstruction,
  ffnConstruction,
  ffnPathFixture,
  headFixture,
  historyFixture,
  identityCacheKey,
  linearFixture,
  maskReceiptFixture,
  maskReceiptMatches,
  projectionLedger,
  rankFixture,
  sampleModel,
  stopwatchFixture,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'deep-dive-light-peft',
  validateModel,
  scenes: [
    openingStage,
    parallelProductStage,
    executionGradientStage,
    costStage,
    quantizedVersusSlicedStage,
    sourceBoundaryStage,
    receiptIdentityStage,
    handoffStage,
    maskGradientStage,
    headsStage,
    signedGatesStage,
    ffnStage,
    globalVersusLocalStage,
    thresholdBoundariesStage,
    moduleRatioStage,
    historySanitizationStage,
    adapterStage,
    rankDerivativeStage,
    pairedProductStage,
    preservedScaleStage,
    physicalHandoffStage,
    continuationResetStage,
    artifactDiagnosisStage,
    completeStopwatchStage,
    evidenceStage,
    paperTradeoffStage,
    paperMemoryStage,
    paperInferenceStage,
    randomControlStage,
    deploymentStage,
    sameWidthOutputStage,
    sharedFleetStage,
    shiftGateStage,
    runtimeLayoutStage,
    freshPruningStage,
  ],
});
const stages = new Map([
  ['opening', openingStage],
  ['parallel-product', parallelProductStage],
  ['execution-gradient', executionGradientStage],
  ['cost', costStage],
  ['quantized-versus-sliced', quantizedVersusSlicedStage],
  ['source-boundary', sourceBoundaryStage],
  ['receipt-identity', receiptIdentityStage],
  ['handoff', handoffStage],
  ['mask-gradient', maskGradientStage],
  ['heads', headsStage],
  ['signed-gates', signedGatesStage],
  ['ffn', ffnStage],
  ['global-versus-local', globalVersusLocalStage],
  ['threshold-boundaries', thresholdBoundariesStage],
  ['module-ratio', moduleRatioStage],
  ['history-sanitization', historySanitizationStage],
  ['adapter', adapterStage],
  ['rank-derivative', rankDerivativeStage],
  ['paired-product', pairedProductStage],
  ['preserved-scale', preservedScaleStage],
  ['physical-handoff', physicalHandoffStage],
  ['continuation-reset', continuationResetStage],
  ['artifact-diagnosis', artifactDiagnosisStage],
  ['complete-stopwatch', completeStopwatchStage],
  ['evidence', evidenceStage],
  ['paper-tradeoff', paperTradeoffStage],
  ['paper-memory', paperMemoryStage],
  ['paper-inference', paperInferenceStage],
  ['random-control', randomControlStage],
  ['deployment', deploymentStage],
  ['same-width-output', sameWidthOutputStage],
  ['shared-fleet', sharedFleetStage],
  ['shift-gate', shiftGateStage],
  ['runtime-layout', runtimeLayoutStage],
  ['fresh-pruning', freshPruningStage],
]);
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage ? stage.draw(ctx, scene, state, api) : rejectUnknownScene(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;
