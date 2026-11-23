import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import lineStage from './stages/line.mjs';
import residualsStage from './stages/residuals.mjs';
import lossStage from './stages/loss.mjs';
import fitStage from './stages/fit.mjs';
import solveStage from './stages/solve.mjs';
import complexityStage from './stages/complexity.mjs';
import solverScaleStage from './stages/solver-scale.mjs';
import stepBoundStage from './stages/step-bound.mjs';
import penaltyContractStage from './stages/penalty-contract.mjs';
import statisticalContractStage from './stages/statistical-contract.mjs';
import generalizeStage from './stages/generalize.mjs';
export {
  bendFrame,
  coefficientFrame,
  eigenStep,
  fitFrame,
  heldoutFrame,
  interceptEstimatorState,
  lassoLine,
  lossFrame,
  projectionFrame,
  ridgeLine,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'linear-regression',
  validateModel,
  scenes: [
    introStage,
    lineStage,
    residualsStage,
    lossStage,
    fitStage,
    solveStage,
    solverScaleStage,
    stepBoundStage,
    complexityStage,
    penaltyContractStage,
    statisticalContractStage,
    generalizeStage,
  ],
});
export const draw = definition.draw;
export default definition;
