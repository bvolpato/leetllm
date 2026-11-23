import { VAE_CHAPTERS } from './fixtures.mjs';
import { drawUnmatchedOriginal, drawUnmatchedConstruction } from './route-fallbacks.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import bottleneckStage from './stages/bottleneck.mjs';
import decoderPixelStage from './stages/decoder-pixel.mjs';
import reconstructionStage from './stages/reconstruction.mjs';
import codeTestStage from './stages/code-test.mjs';
import trainingBaselineStage from './stages/training-baseline.mjs';
import posteriorStage from './stages/posterior.mjs';
import posteriorContractStage from './stages/posterior-contract.mjs';
import klLedgerStage from './stages/kl-ledger.mjs';
import samplingStage from './stages/sampling.mjs';
import gradientPathStage from './stages/gradient-path.mjs';
import objectiveStage from './stages/objective.mjs';
import evidenceGapStage from './stages/evidence-gap.mjs';
import likelihoodScaleStage from './stages/likelihood-scale.mjs';
import trainedVaeStage from './stages/trained-vae.mjs';
import collapseStage from './stages/collapse.mjs';
import informationLedgerStage from './stages/information-ledger.mjs';
import collapseRepairsStage from './stages/collapse-repairs.mjs';
import freeBitsStage from './stages/free-bits.mjs';
import interpolationStage from './stages/interpolation.mjs';
import codesStage from './stages/codes.mjs';
import vqGradientsStage from './stages/vq-gradients.mjs';
import codePriorStage from './stages/code-prior.mjs';
import spatialBudgetStage from './stages/spatial-budget.mjs';
import freshCollisionStage from './stages/fresh-collision.mjs';
export { collapseCaption, collapseProgress } from './arithmetic.mjs';
export { VAE_CHAPTERS, collapseCodes } from './fixtures.mjs';
export {
  CENTER,
  ENCODED,
  LOWER,
  MSE,
  PIXELS,
  RECONSTRUCTION,
  binaryInformationState,
  bottleneckFrame,
  codeSwapFrame,
  codebookFrame,
  codesFrame,
  collapseDifference,
  collapseOutputs,
  decodeCode,
  encode,
  freeBitsState,
  freshCollisionState,
  gaussianEvidenceState,
  posteriorFrame,
  priorDecodeFrame,
  probeCode,
  probePixels,
  reconstructionFrame,
  reparameterizationFrame,
  spatialCompressionFrame,
  vqGradientSnapshot,
} from './model.mjs';
export { validateConstructionModel, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'vae',
  validateModel,
  scenes: [
    introStage,
    bottleneckStage,
    decoderPixelStage,
    reconstructionStage,
    codeTestStage,
    trainingBaselineStage,
    posteriorStage,
    posteriorContractStage,
    klLedgerStage,
    samplingStage,
    gradientPathStage,
    objectiveStage,
    evidenceGapStage,
    likelihoodScaleStage,
    trainedVaeStage,
    collapseStage,
    informationLedgerStage,
    collapseRepairsStage,
    freeBitsStage,
    interpolationStage,
    codesStage,
    vqGradientsStage,
    codePriorStage,
    spatialBudgetStage,
    freshCollisionStage,
  ],
});
const originalDraws = new Map([
  ['intro', introStage.draw],
  ['bottleneck', bottleneckStage.draw],
  ['reconstruction', reconstructionStage.draw],
  ['code-test', codeTestStage.draw],
  ['posterior', posteriorStage.draw],
  ['sampling', samplingStage.draw],
  ['objective', objectiveStage.draw],
  ['collapse', collapseStage.draw],
  ['codes', codesStage.draw],
]);
const constructionDraws = new Map([
  ['decoder-pixel', decoderPixelStage.draw],
  ['training-baseline', trainingBaselineStage.draw],
  ['posterior-contract', posteriorContractStage.draw],
  ['kl-ledger', klLedgerStage.draw],
  ['gradient-path', gradientPathStage.draw],
  ['evidence-gap', evidenceGapStage.draw],
  ['likelihood-scale', likelihoodScaleStage.draw],
  ['trained-vae', trainedVaeStage.draw],
  ['information-ledger', informationLedgerStage.draw],
  ['collapse-repairs', collapseRepairsStage.draw],
  ['free-bits', freeBitsStage.draw],
  ['interpolation', interpolationStage.draw],
  ['vq-gradients', vqGradientsStage.draw],
  ['code-prior', codePriorStage.draw],
  ['spatial-budget', spatialBudgetStage.draw],
  ['fresh-collision', freshCollisionStage.draw],
]);
export function draw(ctx, scene, state, api) {
  if (VAE_CHAPTERS.has(scene.id))
    return api.focus.target('vae-' + scene.id + '-trace', () =>
      (constructionDraws.get(scene.id) ?? drawUnmatchedConstruction)(ctx, scene, state, api),
    );
  return (originalDraws.get(scene.id) ?? drawUnmatchedOriginal)(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
