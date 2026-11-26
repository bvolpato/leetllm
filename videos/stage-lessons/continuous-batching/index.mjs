// Full-bleed dark-cinema 20-scene Continuous Batching & Request Scheduling stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyContinuousBatchingInvariants } from './parts.mjs';
import fittingAndFairness from './scenes/fitting-and-fairness.mjs';
import freshAdmission from './scenes/fresh-admission.mjs';
import intro from './scenes/intro.mjs';
import iterations from './scenes/iterations.mjs';
import latency from './scenes/latency.mjs';
import loadOperatingPoint from './scenes/load-operating-point.mjs';
import memory from './scenes/memory.mjs';
import overloadAndHealth from './scenes/overload-and-health.mjs';
import physicalPages from './scenes/physical-pages.mjs';
import prefill from './scenes/prefill.mjs';
import projectedGrowth from './scenes/projected-growth.mjs';
import queuePolicies from './scenes/queue-policies.mjs';
import recomputeHistory from './scenes/recompute-history.mjs';
import refill from './scenes/refill.mjs';
import scheduler from './scenes/scheduler.mjs';
import sloCompletions from './scenes/slo-completions.mjs';
import speculativeWork from './scenes/speculative-work.mjs';
import stateHandoff from './scenes/state-handoff.mjs';
import staticBatch from './scenes/static.mjs';
import transfer from './scenes/transfer.mjs';

export default cinematicLesson({
  id: 'continuous-batching',
  accent: COSMOS.cyan,
  invariants: verifyContinuousBatchingInvariants,
  scenes: {
    intro,
    iterations,
    static: staticBatch,
    refill,
    scheduler,
    'queue-policies': queuePolicies,
    'fitting-and-fairness': fittingAndFairness,
    prefill,
    memory,
    'physical-pages': physicalPages,
    'projected-growth': projectedGrowth,
    'recompute-history': recomputeHistory,
    'speculative-work': speculativeWork,
    latency,
    'slo-completions': sloCompletions,
    'load-operating-point': loadOperatingPoint,
    'state-handoff': stateHandoff,
    'overload-and-health': overloadAndHealth,
    transfer,
    'fresh-admission': freshAdmission,
  },
});
