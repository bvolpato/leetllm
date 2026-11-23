import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { draw } from './compatibility.mjs';
export { draw } from './compatibility.mjs';
import openingStage from './stages/opening.mjs';
import forwardStage from './stages/forward.mjs';
import sensitivityStage from './stages/sensitivity.mjs';
import reverseModeStage from './stages/reverse-mode.mjs';
import oneUpdateStage from './stages/one-update.mjs';
import gradientCheckStage from './stages/gradient-check.mjs';
import autogradBufferStage from './stages/autograd-buffer.mjs';
import localRulesStage from './stages/local-rules.mjs';
import nonlinearRequestStage from './stages/nonlinear-request.mjs';
import trainingLoopStage from './stages/training-loop.mjs';
import batchesStage from './stages/batches.mjs';
import learningRateStage from './stages/learning-rate.mjs';
import deepGradientsStage from './stages/deep-gradients.mjs';
import initializationStage from './stages/initialization.mjs';
import diagnosisStage from './stages/diagnosis.mjs';
import validationStage from './stages/validation.mjs';
import networkTransferStage from './stages/network-transfer.mjs';
import nextLossStage from './stages/next-loss.mjs';
export { example } from './fixtures.mjs';
export {
  classificationTrace,
  cueProgress,
  finiteDifference,
  microbatchGradients,
  nonlinearTrace,
  reverseTrace,
  sampleModel,
  simulateStopping,
  tokenMeanTrace,
  updateOnce,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'training-backpropagation-gradient-descent',
  validateModel,
  scenes: [
    openingStage,
    forwardStage,
    sensitivityStage,
    reverseModeStage,
    oneUpdateStage,
    gradientCheckStage,
    autogradBufferStage,
    localRulesStage,
    nonlinearRequestStage,
    trainingLoopStage,
    batchesStage,
    learningRateStage,
    deepGradientsStage,
    initializationStage,
    diagnosisStage,
    validationStage,
    networkTransferStage,
    nextLossStage,
  ],
});
export default Object.freeze({
  ...definition,
  draw,
});
