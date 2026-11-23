import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import programContract from './stages/program-contract.mjs';
import regressionOracle from './stages/regression-oracle.mjs';
import gradient from './stages/gradient.mjs';
import transformOrder from './stages/transform-order.mjs';
import tree from './stages/tree.mjs';
import dynamicStatic from './stages/dynamic-static.mjs';
import values from './stages/values.mjs';
import indexingBounds from './stages/indexing-bounds.mjs';
import keys from './stages/keys.mjs';
import keyReplay from './stages/key-replay.mjs';
import keyOwnership from './stages/key-ownership.mjs';
import state from './stages/state.mjs';
import stateReplay from './stages/state-replay.mjs';
import jit from './stages/jit.mjs';
import compileStages from './stages/compile-stages.mjs';
import capturedGlobal from './stages/captured-global.mjs';
import weakTyping from './stages/weak-typing.mjs';
import maskedPadding from './stages/masked-padding.mjs';
import tracerBranch from './stages/tracer-branch.mjs';
import inactiveLog from './stages/inactive-log.mjs';
import loopContract from './stages/loop-contract.mjs';
import deviceLayout from './stages/device-layout.mjs';
import regularizer from './stages/regularizer.mjs';
import timing from './stages/timing.mjs';
import measurementContract from './stages/measurement-contract.mjs';
import evidencePreservation from './stages/evidence-preservation.mjs';
import freshBoundary from './stages/fresh-boundary.mjs';
import lastBatch from './stages/last-batch.mjs';
export {
  capturedCalls,
  doublingTraces,
  exampleGradients,
  momentumFixture,
  paddedReduction,
  projectionFixture,
  regularizedHistory,
  weightPenalty,
} from './arithmetic.mjs';
export { JAX_KEY_FIXTURE, REGRESSION_ROWS, regression } from './fixtures.mjs';
export { sampleModel, validateJaxConstruction, validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'jax-for-ml-research',
  validateModel,
  scenes: [
    intro,
    programContract,
    regressionOracle,
    gradient,
    transformOrder,
    tree,
    dynamicStatic,
    values,
    indexingBounds,
    keys,
    keyReplay,
    keyOwnership,
    state,
    stateReplay,
    jit,
    maskedPadding,
    compileStages,
    capturedGlobal,
    weakTyping,
    freshBoundary,
    tracerBranch,
    inactiveLog,
    loopContract,
    deviceLayout,
    regularizer,
    timing,
    measurementContract,
    evidencePreservation,
    lastBatch,
  ],
});
export const draw = definition.draw;
export default definition;
