import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import corpusExposureStage from './stages/corpus-exposure.mjs';
import targetsStage from './stages/targets.mjs';
import byteBoundariesStage from './stages/byte-boundaries.mjs';
import maskStage from './stages/mask.mjs';
import vocabStage from './stages/vocab.mjs';
import compactDenominatorStage from './stages/compact-denominator.mjs';
import streamBoundariesStage from './stages/stream-boundaries.mjs';
import forwardStage from './stages/forward.mjs';
import prelnBlockStage from './stages/preln-block.mjs';
import lossStage from './stages/loss.mjs';
import checkpointsStage from './stages/checkpoints.mjs';
import generationChoiceStage from './stages/generation-choice.mjs';
import resumeStage from './stages/resume.mjs';
import resumeForkStage from './stages/resume-fork.mjs';
import architectureChoicesStage from './stages/architecture-choices.mjs';
import kernelDiagnosticsStage from './stages/kernel-diagnostics.mjs';
import changedContractStage from './stages/changed-contract.mjs';
export { ATTENTION_CPU_FIXTURE, CHAPTER_IDS } from './fixtures.mjs';
export {
  adamFork,
  bytePieceFixture,
  categoricalFixture,
  corpusCounts,
  decoderMiniature,
  localProbe,
  lossStep,
  maskedPredictionFixture,
  normComparison,
  samplerWindow,
  scalarAdam,
  tiedOutput,
} from './arithmetic.mjs';
export {
  checkpointSnapshot,
  lossConstruction,
  sampleModel,
  transferSnapshot,
} from './construction.mjs';
export { validateChapters, validateModel } from './model.mjs';
const film = defineCanvasLesson({
  id: 'build-gpt-from-scratch-lab',
  validateModel,
  scenes: [
    introStage,
    targetsStage,
    byteBoundariesStage,
    vocabStage,
    compactDenominatorStage,
    corpusExposureStage,
    streamBoundariesStage,
    maskStage,
    forwardStage,
    lossStage,
    prelnBlockStage,
    checkpointsStage,
    generationChoiceStage,
    resumeStage,
    resumeForkStage,
    architectureChoicesStage,
    kernelDiagnosticsStage,
    changedContractStage,
  ],
});
export const draw = film.draw;
export default film;
