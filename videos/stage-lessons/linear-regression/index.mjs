// Cinematic Vizmatic 0.10.0 stage film for `linear-regression` (How a Line Learns to Predict: 12 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLinearRegressionInvariants } from './shared.mjs';
import { fit, intro, lineScene, loss, residuals, solve } from './scenes/act1-line-loss.mjs';
import {
  complexity,
  generalize,
  penaltyContract,
  solverScale,
  statisticalContract,
  stepBound,
} from './scenes/act2-solve-regularize.mjs';

export default cinematicLesson({
  id: 'linear-regression',
  accent: COSMOS.cyan,
  invariants: verifyLinearRegressionInvariants,
  scenes: {
    intro,
    line: lineScene,
    residuals,
    loss,
    fit,
    solve,
    'solver-scale': solverScale,
    'step-bound': stepBound,
    complexity,
    'penalty-contract': penaltyContract,
    'statistical-contract': statisticalContract,
    generalize,
  },
});
