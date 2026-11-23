import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import tensors from './stages/tensors.mjs';
import lossContract from './stages/loss-contract.mjs';
import scores from './stages/scores.mjs';
import phases from './stages/phases.mjs';
import noneAndMomentum from './stages/none-and-momentum.mjs';
import accumulation from './stages/accumulation.mjs';
import microbatchDenominators from './stages/microbatch-denominators.mjs';
import batching from './stages/batching.mjs';
import fitBatch from './stages/fit-batch.mjs';
import layerModes from './stages/layer-modes.mjs';
import validation from './stages/validation.mjs';
import resumptionState from './stages/resumption-state.mjs';
import atomicCheckpoint from './stages/atomic-checkpoint.mjs';
import numericalTriage from './stages/numerical-triage.mjs';
import globalClipping from './stages/global-clipping.mjs';
import inferenceFeatureBoundary from './stages/inference-feature-boundary.mjs';
import ampPolicy from './stages/amp-policy.mjs';
import scaleAndStep from './stages/scale-and-step.mjs';
import compileContract from './stages/compile-contract.mjs';
import bigramState from './stages/bigram-state.mjs';
import bigramFloor from './stages/bigram-floor.mjs';
import bigramSelection from './stages/bigram-selection.mjs';
import runReceipt from './stages/run-receipt.mjs';
import transfer from './stages/transfer.mjs';
import freshStaleGradient from './stages/fresh-stale-gradient.mjs';
export { epochMean, loopAmpOrder, loopClip, loopMicrobatch, loopMomentum } from './arithmetic.mjs';
export {
  checkpointSnapshot,
  loopAtomicState,
  loopFreshState,
  modelSnapshot,
} from './construction.mjs';
export { FEATURES, LABELS, LR } from './fixtures.mjs';
export { LOOP_BIGRAM, oneTrainingStep, trainBigramHistory, trainFitFixture } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'training-loop',
  validateModel,
  scenes: [
    intro,
    tensors,
    lossContract,
    scores,
    phases,
    noneAndMomentum,
    accumulation,
    microbatchDenominators,
    batching,
    fitBatch,
    layerModes,
    validation,
    resumptionState,
    atomicCheckpoint,
    numericalTriage,
    globalClipping,
    inferenceFeatureBoundary,
    ampPolicy,
    scaleAndStep,
    compileContract,
    bigramState,
    bigramFloor,
    bigramSelection,
    runReceipt,
    transfer,
    freshStaleGradient,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error('Unknown loop construction ' + scene.id);
}
export default Object.freeze({ ...definition, draw });
