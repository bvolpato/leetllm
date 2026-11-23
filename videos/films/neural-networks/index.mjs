import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnrecognizedScene } from './compatibility.mjs';
import puzzleStage from './stages/puzzle.mjs';
import collapseStage from './stages/collapse.mjs';
import affineIdentityStage from './stages/affine-identity.mjs';
import hingesStage from './stages/hinges.mjs';
import scorerStage from './stages/scorer.mjs';
import boundedStage from './stages/bounded.mjs';
import smoothStage from './stages/smooth.mjs';
import activationProductsStage from './stages/activation-products.mjs';
import forwardStage from './stages/forward.mjs';
import parametersStage from './stages/parameters.mjs';
import parameterScaleStage from './stages/parameter-scale.mjs';
import batchStage from './stages/batch.mjs';
import outputDenominatorStage from './stages/output-denominator.mjs';
import transposeStage from './stages/transpose.mjs';
import residualStage from './stages/residual.mjs';
import backwardStage from './stages/backward.mjs';
import savedValuesStage from './stages/saved-values.mjs';
import updateStage from './stages/update.mjs';
import cornerCheckStage from './stages/corner-check.mjs';
import unitsStage from './stages/units.mjs';
import stableStage from './stages/stable.mjs';
import checkedRiskReportStage from './stages/checked-risk-report.mjs';
import approximationStage from './stages/approximation.mjs';
import approximationConditionsStage from './stages/approximation-conditions.mjs';
import payoffStage from './stages/payoff.mjs';
import earnedGradientTransferStage from './stages/earned-gradient-transfer.mjs';
export {
  approximation,
  binaryMeanGradients,
  denseParameterCount,
  finiteReluSecant,
  forward,
  gradientStep,
  gradientVector,
  parameterVector,
  sigmoid,
  sigmoidBranch,
  signedChain,
  stableBce,
  standardize,
  targetCurve,
  triangle,
} from './arithmetic.mjs';
export {
  CASES,
  OWNER_IDS,
  PARAMETERS,
  REQUESTS,
  REQUEST_IDS,
  TARGETS,
  activations,
} from './fixtures.mjs';
export {
  affineWitness,
  backward,
  batchGradient,
  freshGradient,
  requestForward,
  transposeExample,
} from './model.mjs';
export {
  cueProgress,
  freshGradientFrame,
  lampState,
  neuralFrame,
  triangleConstruction,
} from './construction.mjs';
export { validateConstruction, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'neural-networks',
  validateModel,
  scenes: [
    puzzleStage,
    collapseStage,
    hingesStage,
    scorerStage,
    forwardStage,
    affineIdentityStage,
    boundedStage,
    smoothStage,
    activationProductsStage,
    parametersStage,
    parameterScaleStage,
    batchStage,
    transposeStage,
    residualStage,
    backwardStage,
    outputDenominatorStage,
    savedValuesStage,
    updateStage,
    cornerCheckStage,
    earnedGradientTransferStage,
    unitsStage,
    stableStage,
    checkedRiskReportStage,
    approximationStage,
    approximationConditionsStage,
    payoffStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
