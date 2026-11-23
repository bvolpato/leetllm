import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { drawUnknownOptimizerScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import firstStepStage from './stages/first-step.mjs';
import stabilityStage from './stages/stability.mjs';
import momentumStage from './stages/momentum.mjs';
import momentumConventionsStage from './stages/momentum-conventions.mjs';
import rmspropStage from './stages/rmsprop.mjs';
import adamBuffersStage from './stages/adam-buffers.mjs';
import adamStepStage from './stages/adam-step.mjs';
import adamHistoryStage from './stages/adam-history.mjs';
import objectiveScaleStage from './stages/objective-scale.mjs';
import comparisonStage from './stages/comparison.mjs';
import scheduleStage from './stages/schedule.mjs';
import accumulationStage from './stages/accumulation.mjs';
import clippingStage from './stages/clipping.mjs';
import decayStage from './stages/decay.mjs';
import zeroDataDecayStage from './stages/zero-data-decay.mjs';
import torchLoopStage from './stages/torch-loop.mjs';
import checkpointHistoryStage from './stages/checkpoint-history.mjs';
import optimizerMemoryStage from './stages/optimizer-memory.mjs';
import evidenceBudgetStage from './stages/evidence-budget.mjs';
import diagnosticTraceStage from './stages/diagnostic-trace.mjs';
import transferStage from './stages/transfer.mjs';
import freshRecipeStage from './stages/fresh-recipe.mjs';
export {
  COLD,
  COUPLED,
  CPU_LOOP_TRACE,
  CPU_RESUME_TRACE,
  DECAY,
  DIAGNOSTIC_RUNS,
  EIGHTY,
  FRESH_RECIPE,
  PATHS,
  PRESCRIBED,
  PRESCRIBED_GRADIENTS,
  RUNS,
  SCHEDULED,
  UNSAFE,
  ZERO_DECAY,
} from './fixtures.mjs';
export {
  SETTINGS,
  gradient,
  loss,
  optimizerFirstStep,
  scalarAdamWStep,
  scheduledRate,
  simulate,
  trajectory,
} from './arithmetic.mjs';
export {
  adamWReveal,
  cueProgress,
  momentumFrame,
  traceState,
  transferState,
} from './construction.mjs';
export { adamState, validateModel } from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'optimizers',
  validateModel,
  scenes: [
    introStage,
    firstStepStage,
    stabilityStage,
    momentumStage,
    momentumConventionsStage,
    rmspropStage,
    adamBuffersStage,
    adamStepStage,
    adamHistoryStage,
    objectiveScaleStage,
    comparisonStage,
    scheduleStage,
    accumulationStage,
    clippingStage,
    decayStage,
    zeroDataDecayStage,
    torchLoopStage,
    checkpointHistoryStage,
    optimizerMemoryStage,
    evidenceBudgetStage,
    diagnosticTraceStage,
    transferStage,
    freshRecipeStage,
  ],
});
const stages = new Map(orderedDefinition.scenes.map((stage) => [stage.id, stage]));
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage
    ? stage.draw(ctx, scene, state, api)
    : drawUnknownOptimizerScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...orderedDefinition,
  draw,
});
