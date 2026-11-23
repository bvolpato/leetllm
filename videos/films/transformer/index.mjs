import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { draw } from './compatibility.mjs';
export { draw } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import embeddingStage from './stages/embedding.mjs';
import normalizationStage from './stages/normalization.mjs';
import maskStage from './stages/mask.mjs';
import attentionStage from './stages/attention.mjs';
import residualStage from './stages/residual.mjs';
import feedForwardStage from './stages/feed-forward.mjs';
import causalityStage from './stages/causality.mjs';
import logitsStage from './stages/logits.mjs';
import feedbackStage from './stages/feedback.mjs';
import positionDesignsStage from './stages/position-designs.mjs';
import matchingScaleStage from './stages/matching-scale.mjs';
import parallelHeadsStage from './stages/parallel-heads.mjs';
import ffnVariantsStage from './stages/ffn-variants.mjs';
import normContractsStage from './stages/norm-contracts.mjs';
import causalTrainingStage from './stages/causal-training.mjs';
import apiAlignmentStage from './stages/api-alignment.mjs';
import executableContractsStage from './stages/executable-contracts.mjs';
import vocabularyContractStage from './stages/vocabulary-contract.mjs';
import architectureVisibilityStage from './stages/architecture-visibility.mjs';
import realScaleStage from './stages/real-scale.mjs';
import failureContractStage from './stages/failure-contract.mjs';
import freshDecoderStage from './stages/fresh-decoder.mjs';
export { EMBED, EXTENDED_SCENES, HEAD_WORKSHEET, VOCAB, WK, WORDS, WOUT, WQ } from './fixtures.mjs';
export {
  mergeHeads,
  norm,
  normStats,
  position,
  positionIds,
  project,
  slice14,
  splitHeads,
  unmaskedRead,
} from './arithmetic.mjs';
export {
  FEEDBACK,
  FEEDBACK_IDS,
  FEEDBACK_INPUT,
  FRESH,
  INPUT,
  MODEL,
  attentionMixFrame,
  choiceFrame,
  compute,
  decisionSpatialFrame,
  embeddingFrame,
  extendedFrame,
  feedbackFrame,
  ffnSpatialFrame,
  normalizationFrame,
  probabilityProgress,
  residualSpatialFrame,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'transformer',
  validateModel,
  scenes: [
    introStage,
    embeddingStage,
    normalizationStage,
    maskStage,
    attentionStage,
    residualStage,
    feedForwardStage,
    causalityStage,
    logitsStage,
    feedbackStage,
    positionDesignsStage,
    matchingScaleStage,
    parallelHeadsStage,
    ffnVariantsStage,
    normContractsStage,
    causalTrainingStage,
    apiAlignmentStage,
    executableContractsStage,
    vocabularyContractStage,
    architectureVisibilityStage,
    realScaleStage,
    failureContractStage,
    freshDecoderStage,
  ],
});
export default Object.freeze({
  ...definition,
  draw,
});
