// Cinematic Vizmatic 0.10.0 stage film for `probability` (Would You Trust This Flag?: 21 scenes).
// All numerical values derive from videos/films/probability/ and pass build-time invariant checks.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyProbabilityInvariants } from './shared.mjs';
import { bayes, conditional, filter, indicator, intro, population } from './scenes/act1-bayes.mjs';
import {
  copiedEvidence,
  independence,
  likelihood,
  posteriorContract,
  priorShift,
} from './scenes/act2-evidence.mjs';
import {
  calibrationCheck,
  distributionChoice,
  logLoss,
  softmaxSampling,
  tokenChain,
} from './scenes/act3-distributions.mjs';
import {
  decisions,
  newBatch,
  payoff,
  rateGap,
  samplingError,
} from './scenes/act4-inference-decisions.mjs';

export default cinematicLesson({
  id: 'probability',
  accent: COSMOS.cyan,
  invariants: verifyProbabilityInvariants,
  scenes: {
    intro,
    population,
    indicator,
    filter,
    conditional,
    bayes,
    'prior-shift': priorShift,
    independence,
    'copied-evidence': copiedEvidence,
    'posterior-contract': posteriorContract,
    likelihood,
    'calibration-check': calibrationCheck,
    'distribution-choice': distributionChoice,
    'softmax-sampling': softmaxSampling,
    'token-chain': tokenChain,
    'log-loss': logLoss,
    'sampling-error': samplingError,
    'rate-gap': rateGap,
    decisions,
    payoff,
    'new-batch': newBatch,
  },
});
