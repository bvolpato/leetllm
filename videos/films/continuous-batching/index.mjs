import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import iterations from './stages/iterations.mjs';
import staticBatching from './stages/static.mjs';
import refill from './stages/refill.mjs';
import scheduler from './stages/scheduler.mjs';
import queuePolicies from './stages/queue-policies.mjs';
import fittingAndFairness from './stages/fitting-and-fairness.mjs';
import prefill from './stages/prefill.mjs';
import memory from './stages/memory.mjs';
import physicalPages from './stages/physical-pages.mjs';
import projectedGrowth from './stages/projected-growth.mjs';
import recomputeHistory from './stages/recompute-history.mjs';
import speculativeWork from './stages/speculative-work.mjs';
import latency from './stages/latency.mjs';
import sloCompletions from './stages/slo-completions.mjs';
import loadOperatingPoint from './stages/load-operating-point.mjs';
import stateHandoff from './stages/state-handoff.mjs';
import overloadAndHealth from './stages/overload-and-health.mjs';
import transfer from './stages/transfer.mjs';
import freshAdmission from './stages/fresh-admission.mjs';
export { REQUESTS } from './fixtures.mjs';
export {
  freshBatchingBoundary,
  handoffTiming,
  highestPassingLoad,
  memorySnapshot,
  pageCount,
  prefillChunkSnapshot,
  schedule,
  scheduleSnapshot,
  serialCompletion,
  useful,
  validateBatchingUpgrade,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'continuous-batching',
  validateModel,
  scenes: [
    intro,
    iterations,
    staticBatching,
    refill,
    scheduler,
    queuePolicies,
    fittingAndFairness,
    prefill,
    memory,
    physicalPages,
    projectedGrowth,
    recomputeHistory,
    speculativeWork,
    latency,
    sloCompletions,
    loadOperatingPoint,
    stateHandoff,
    overloadAndHealth,
    transfer,
    freshAdmission,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  api.focus.target(scene.id + '-mechanism', () => {});
  throw new Error(`Unknown continuous-batching scene ${scene.id}`);
}
export default Object.freeze({
  ...definition,
  draw,
});
