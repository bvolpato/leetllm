import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyFeatureEngineeringInvariants } from './shared.mjs';
import {
  decisionTime,
  intro,
  numericalScale,
  runningStatistics,
  scaleArtifact,
  temporalContract,
} from './scenes/act1-time-scale.mjs';
import {
  categories,
  categoryContract,
  crossfitConstruction,
  maturedEncoding,
  missingness,
} from './scenes/act2-missing-categories-target.mjs';
import {
  contract,
  preprocessingChange,
  rowValidation,
  vectorConstruction,
} from './scenes/act3-contract-vector-preprocess.mjs';
import {
  earnedFeatureTransfer,
  parity,
  parityCalculation,
  storeAndFreshness,
  wrap,
} from './scenes/act4-parity-store-transfer.mjs';

export default cinematicLesson({
  id: 'feature-engineering',
  accent: COSMOS.cyan,
  invariants: verifyFeatureEngineeringInvariants,
  scenes: {
    intro,
    'decision-time': decisionTime,
    'temporal-contract': temporalContract,
    'numerical-scale': numericalScale,
    'running-statistics': runningStatistics,
    'scale-artifact': scaleArtifact,
    missingness,
    categories,
    'category-contract': categoryContract,
    'crossfit-construction': crossfitConstruction,
    'matured-encoding': maturedEncoding,
    contract,
    'row-validation': rowValidation,
    'vector-construction': vectorConstruction,
    'preprocessing-change': preprocessingChange,
    parity,
    'parity-calculation': parityCalculation,
    'store-and-freshness': storeAndFreshness,
    wrap,
    'earned-feature-transfer': earnedFeatureTransfer,
  },
});
