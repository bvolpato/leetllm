import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import entryContract from './stages/entry-contract.mjs';
import fragmentation from './stages/fragmentation.mjs';
import blocks from './stages/blocks.mjs';
import historicalEvidence from './stages/historical-evidence.mjs';
import processOwners from './stages/process-owners.mjs';
import prefix from './stages/prefix.mjs';
import prefixLimit from './stages/prefix-limit.mjs';
import hashContext from './stages/hash-context.mjs';
import poolStructures from './stages/pool-structures.mjs';
import budget from './stages/budget.mjs';
import chunkClock from './stages/chunk-clock.mjs';
import runningPreemption from './stages/running-preemption.mjs';
import lifetime from './stages/lifetime.mjs';
import queueOrder from './stages/queue-order.mjs';
import admission from './stages/admission.mjs';
import runnerContract from './stages/runner-contract.mjs';
import parallelCosts from './stages/parallel-costs.mjs';
import runnerVersions from './stages/runner-versions.mjs';
import goodput from './stages/goodput.mjs';
import goodputDenominator from './stages/goodput-denominator.mjs';
import eventMetrics from './stages/event-metrics.mjs';
import routeSecurity from './stages/route-security.mjs';
import mediaLimits from './stages/media-limits.mjs';
import tenantCache from './stages/tenant-cache.mjs';
import synthesis from './stages/synthesis.mjs';
import sourceDiagnosis from './stages/source-diagnosis.mjs';
import projectIdentity from './stages/project-identity.mjs';
import freshAdmission from './stages/fresh-admission.mjs';
export { reuse } from './arithmetic.mjs';
export {
  budgetTrace,
  goodputReceiptState,
  lifetimeTrace,
  sampleModel,
  vvProgress,
  vvState,
} from './construction.mjs';
export { references, schedule, vvReleaseRequest, vvTouchAllocate } from './model.mjs';
export { validateModel, vvValidate } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-vllm',
  validateModel,
  scenes: [
    intro,
    entryContract,
    fragmentation,
    blocks,
    historicalEvidence,
    processOwners,
    prefix,
    prefixLimit,
    hashContext,
    poolStructures,
    budget,
    chunkClock,
    runningPreemption,
    lifetime,
    queueOrder,
    admission,
    runnerContract,
    parallelCosts,
    runnerVersions,
    goodput,
    goodputDenominator,
    eventMetrics,
    routeSecurity,
    mediaLimits,
    tenantCache,
    synthesis,
    sourceDiagnosis,
    projectIdentity,
    freshAdmission,
  ],
});
export const draw = definition.draw;
export default definition;
