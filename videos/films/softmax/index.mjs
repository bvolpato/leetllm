import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { draw } from './compatibility.mjs';
export { draw } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import scoresStage from './stages/scores.mjs';
import exponentialsStage from './stages/exponentials.mjs';
import massStage from './stages/mass.mjs';
import lossStage from './stages/loss.mjs';
import gradientChainStage from './stages/gradient-chain.mjs';
import gradientStage from './stages/gradient.mjs';
import updateStage from './stages/update.mjs';
import temperatureStage from './stages/temperature.mjs';
import transferStage from './stages/transfer.mjs';
import entropyReferenceStage from './stages/entropy-reference.mjs';
import squaredVsCeStage from './stages/squared-vs-ce.mjs';
import lossInputContractStage from './stages/loss-input-contract.mjs';
import temperatureLimitsStage from './stages/temperature-limits.mjs';
import smoothingEquilibriumStage from './stages/smoothing-equilibrium.mjs';
import teacherForcingStage from './stages/teacher-forcing.mjs';
import tokenReductionStage from './stages/token-reduction.mjs';
import classNotPositionStage from './stages/class-not-position.mjs';
import weightedReductionStage from './stages/weighted-reduction.mjs';
import vocabularyTilesStage from './stages/vocabulary-tiles.mjs';
import earnedTransferStage from './stages/earned-transfer.mjs';
export {
  FRESH_LOGITS,
  FRESH_TARGET,
  GRAD,
  LOGITS,
  PROBS,
  TARGET,
  UPDATED,
  WORDS,
} from './fixtures.mjs';
export {
  crossEntropy,
  entropy,
  lossTrace,
  onlineLogSumExp,
  positionReduction,
  positiveTemperature,
  probabilityLossGradient,
  softmaxJacobian,
} from './arithmetic.mjs';
export {
  completeFrame,
  completeModel,
  exponentialState,
  freshState,
  gradientState,
  massState,
  temperatureCueState,
  transferTarget,
  updateCueState,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'softmax',
  validateModel,
  scenes: [
    introStage,
    scoresStage,
    exponentialsStage,
    massStage,
    lossStage,
    gradientChainStage,
    gradientStage,
    updateStage,
    temperatureStage,
    transferStage,
    entropyReferenceStage,
    squaredVsCeStage,
    lossInputContractStage,
    temperatureLimitsStage,
    smoothingEquilibriumStage,
    teacherForcingStage,
    tokenReductionStage,
    classNotPositionStage,
    weightedReductionStage,
    vocabularyTilesStage,
    earnedTransferStage,
  ],
});
export default Object.freeze({
  ...definition,
  draw,
});
