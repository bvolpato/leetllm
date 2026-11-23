import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import populationStage from './stages/population.mjs';
import indicatorStage from './stages/indicator.mjs';
import filterStage from './stages/filter.mjs';
import conditionalStage from './stages/conditional.mjs';
import bayesStage from './stages/bayes.mjs';
import priorShiftStage from './stages/prior-shift.mjs';
import independenceStage from './stages/independence.mjs';
import copiedEvidenceStage from './stages/copied-evidence.mjs';
import likelihoodStage from './stages/likelihood.mjs';
import decisionsStage from './stages/decisions.mjs';
import payoffStage from './stages/payoff.mjs';
import posteriorContractStage from './stages/posterior-contract.mjs';
import calibrationCheckStage from './stages/calibration-check.mjs';
import distributionChoiceStage from './stages/distribution-choice.mjs';
import tokenChainStage from './stages/token-chain.mjs';
import softmaxSamplingStage from './stages/softmax-sampling.mjs';
import logLossStage from './stages/log-loss.mjs';
import samplingErrorStage from './stages/sampling-error.mjs';
import rateGapStage from './stages/rate-gap.mjs';
import newBatchStage from './stages/new-batch.mjs';
export { checkedPosterior, posterior } from './arithmetic.mjs';
export { broad, freshQueue, population, queuePackets, strict } from './fixtures.mjs';
export {
  conditionalSnapshot,
  likelihoodSnapshot,
  policySnapshot,
  priorSnapshot,
  queueSnapshot,
  repeatedRates,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'probability',
  validateModel,
  scenes: [
    introStage,
    populationStage,
    indicatorStage,
    filterStage,
    conditionalStage,
    bayesStage,
    priorShiftStage,
    independenceStage,
    copiedEvidenceStage,
    posteriorContractStage,
    likelihoodStage,
    calibrationCheckStage,
    distributionChoiceStage,
    softmaxSamplingStage,
    tokenChainStage,
    logLossStage,
    samplingErrorStage,
    rateGapStage,
    decisionsStage,
    payoffStage,
    newBatchStage,
  ],
});
export const draw = definition.draw;
export default definition;
