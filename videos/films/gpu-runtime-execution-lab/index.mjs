import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownRuntimeScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import pipelineValuesStage from './stages/pipeline-values.mjs';
import scheduleStage from './stages/schedule.mjs';
import completionScopeStage from './stages/completion-scope.mjs';
import defaultStreamsStage from './stages/default-streams.mjs';
import eventsStage from './stages/events.mjs';
import eventGenerationsStage from './stages/event-generations.mjs';
import overlapSlotsStage from './stages/overlap-slots.mjs';
import allocatorLifetimeStage from './stages/allocator-lifetime.mjs';
import intervalMathStage from './stages/interval-math.mjs';
import benchPreflightStage from './stages/bench-preflight.mjs';
import graphsStage from './stages/graphs.mjs';
import captureLifecycleStage from './stages/capture-lifecycle.mjs';
import captureFrontierStage from './stages/capture-frontier.mjs';
import amortizationRuleStage from './stages/amortization-rule.mjs';
import pointersStage from './stages/pointers.mjs';
import graphUpdatesStage from './stages/graph-updates.mjs';
import paddingStage from './stages/padding.mjs';
import compatibleDispatchStage from './stages/compatible-dispatch.mjs';
import workersStage from './stages/workers.mjs';
import persistentPublicationStage from './stages/persistent-publication.mjs';
import resourceCycleStage from './stages/resource-cycle.mjs';
import realLabWalkStage from './stages/real-lab-walk.mjs';
import measuredReceiptStage from './stages/measured-receipt.mjs';
import diagnoseTraceStage from './stages/diagnose-trace.mjs';
import freshFourSlotStage from './stages/fresh-four-slot.mjs';
export { QUEUE_EVENTS } from './fixtures.mjs';
export {
  bucketFor,
  eventOverlap,
  graphCost,
  paddingEffects,
  pipeline,
  replayOwnership,
  runtimeFreshState,
  schedule,
} from './arithmetic.mjs';
export { runtimeSentenceProgress, sampleRuntimeChapter } from './construction.mjs';
export { queueState, sampleModel } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'gpu-runtime-execution-lab',
  validateModel,
  scenes: [
    introStage,
    pipelineValuesStage,
    scheduleStage,
    completionScopeStage,
    defaultStreamsStage,
    eventsStage,
    eventGenerationsStage,
    overlapSlotsStage,
    allocatorLifetimeStage,
    intervalMathStage,
    benchPreflightStage,
    graphsStage,
    captureLifecycleStage,
    captureFrontierStage,
    amortizationRuleStage,
    pointersStage,
    graphUpdatesStage,
    paddingStage,
    compatibleDispatchStage,
    workersStage,
    persistentPublicationStage,
    resourceCycleStage,
    realLabWalkStage,
    measuredReceiptStage,
    diagnoseTraceStage,
    freshFourSlotStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : drawUnknownRuntimeScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
