import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import whyTrainStage from './stages/why-train.mjs';
import parametersShapeLossStage from './stages/parameters-shape-loss.mjs';
import probeNeighborStage from './stages/probe-neighbor.mjs';
import derivativeLimitStage from './stages/derivative-limit.mjs';
import gradientVectorStage from './stages/gradient-vector.mjs';
import gradientGeometryStage from './stages/gradient-geometry.mjs';
import updateStepStage from './stages/update-step.mjs';
import stepSizeLimitsStage from './stages/step-size-limits.mjs';
import stableScaleStage from './stages/stable-scale.mjs';
import forwardGraphStage from './stages/forward-graph.mjs';
import chainRuleStage from './stages/chain-rule.mjs';
import reluGateStage from './stages/relu-gate.mjs';
import reluCornerStage from './stages/relu-corner.mjs';
import pathAccumulationStage from './stages/path-accumulation.mjs';
import batchConditioningStage from './stages/batch-conditioning.mjs';
import reverseModeStage from './stages/reverse-mode.mjs';
import vectorSeedStage from './stages/vector-seed.mjs';
import gradientCheckStage from './stages/gradient-check.mjs';
import checkBackwardRuleStage from './stages/check-backward-rule.mjs';
import pytorchLoopStage from './stages/pytorch-loop.mjs';
import savedOutputStage from './stages/saved-output.mjs';
import expandedStorageStage from './stages/expanded-storage.mjs';
import nonlinearForwardStage from './stages/nonlinear-forward.mjs';
import nonlinearUpdateStage from './stages/nonlinear-update.mjs';
import deepProductsStage from './stages/deep-products.mjs';
import keepTheModelHonestStage from './stages/keep-the-model-honest.mjs';
import freshNonlinearStage from './stages/fresh-nonlinear.mjs';
export { BATCH_FEATURES, BATCH_TARGETS, NONLINEAR_START } from './fixtures.mjs';
export {
  BATCH_HISTORY,
  batchGradientState,
  finiteDifference,
  hiddenStep,
  hiddenUnit,
  latencyExample,
  precisionProbe,
  reluBranchState,
  reluCornerDifference,
} from './arithmetic.mjs';
export { nonlinearPredictionState } from './construction.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'gradients-backprop',
  validateModel,
  scenes: [
    subjectIntroStage,
    whyTrainStage,
    parametersShapeLossStage,
    probeNeighborStage,
    derivativeLimitStage,
    gradientVectorStage,
    gradientGeometryStage,
    updateStepStage,
    stepSizeLimitsStage,
    stableScaleStage,
    forwardGraphStage,
    chainRuleStage,
    reluGateStage,
    reluCornerStage,
    pathAccumulationStage,
    batchConditioningStage,
    reverseModeStage,
    vectorSeedStage,
    gradientCheckStage,
    checkBackwardRuleStage,
    pytorchLoopStage,
    savedOutputStage,
    expandedStorageStage,
    nonlinearForwardStage,
    nonlinearUpdateStage,
    deepProductsStage,
    keepTheModelHonestStage,
    freshNonlinearStage,
  ],
});
export const draw = definition.draw;
export default definition;
