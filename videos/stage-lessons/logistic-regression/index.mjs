// Cinematic Vizmatic 0.10.0 stage film for `logistic-regression` (Logistic Regression at the Review Desk: 32 scenes).
// All numerical values derive from videos/films/logistic-regression/ and pass build-time invariant checks.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLogisticInvariants } from './shared.mjs';
import {
  boundaryGeometryScene,
  evidenceScore,
  intro,
  logLossScene,
  sigmoidScene,
} from './scenes/act1-scoring.mjs';
import {
  batchGradient,
  bernoulliLikelihood,
  dataContract,
  gradientScene,
  learningScene,
  lossCurvature,
  separationScene,
} from './scenes/act2-optimization.mjs';
import {
  boundaryScene,
  calibratedCost,
  capacityScene,
  confusionScene,
  denominatorsScene,
  harmonicMean,
} from './scenes/act3-thresholds.mjs';
import {
  apAndTies,
  calibrationError,
  calibrationMaps,
  calibrationScene,
  rankingScene,
  rareEventPopulation,
  rescalingScene,
} from './scenes/act4-ranking-calibration.mjs';
import {
  kernelUncertainty,
  marginObjective,
  multiclassHeads,
  stableSoftmax,
} from './scenes/act5-multiclass-kernels.mjs';
import {
  decisionScene,
  freshOperatingPoint,
  implementationParity,
} from './scenes/act6-parity-decisions.mjs';

export default cinematicLesson({
  id: 'logistic-regression',
  accent: COSMOS.cyan,
  invariants: verifyLogisticInvariants,
  scenes: {
    intro,
    'evidence-score': evidenceScore,
    sigmoid: sigmoidScene,
    'boundary-geometry': boundaryGeometryScene,
    'log-loss': logLossScene,
    'bernoulli-likelihood': bernoulliLikelihood,
    'loss-curvature': lossCurvature,
    gradient: gradientScene,
    'batch-gradient': batchGradient,
    'data-contract': dataContract,
    learning: learningScene,
    separation: separationScene,
    boundary: boundaryScene,
    confusion: confusionScene,
    denominators: denominatorsScene,
    'harmonic-mean': harmonicMean,
    capacity: capacityScene,
    'calibrated-cost': calibratedCost,
    ranking: rankingScene,
    'rare-event-population': rareEventPopulation,
    'ap-and-ties': apAndTies,
    rescaling: rescalingScene,
    calibration: calibrationScene,
    'calibration-error': calibrationError,
    'calibration-maps': calibrationMaps,
    'multiclass-heads': multiclassHeads,
    'stable-softmax': stableSoftmax,
    'margin-objective': marginObjective,
    'kernel-uncertainty': kernelUncertainty,
    'implementation-parity': implementationParity,
    'fresh-operating-point': freshOperatingPoint,
    decision: decisionScene,
  },
});
