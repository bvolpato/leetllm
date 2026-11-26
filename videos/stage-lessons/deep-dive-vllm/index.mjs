// Deep Dive - vLLM: Full-bleed cinematic Vizmatic 0.10.0 stage film (29 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyVllmInvariants } from './parts.mjs';

import intro from './scenes/intro.mjs';
import entryContract from './scenes/entry-contract.mjs';
import fragmentation from './scenes/fragmentation.mjs';
import blocks from './scenes/blocks.mjs';
import historicalEvidence from './scenes/historical-evidence.mjs';
import processOwners from './scenes/process-owners.mjs';
import prefix from './scenes/prefix.mjs';
import prefixLimit from './scenes/prefix-limit.mjs';
import hashContext from './scenes/hash-context.mjs';
import poolStructures from './scenes/pool-structures.mjs';
import budget from './scenes/budget.mjs';
import chunkClock from './scenes/chunk-clock.mjs';
import runningPreemption from './scenes/running-preemption.mjs';
import lifetime from './scenes/lifetime.mjs';
import queueOrder from './scenes/queue-order.mjs';
import admission from './scenes/admission.mjs';
import runnerContract from './scenes/runner-contract.mjs';
import parallelCosts from './scenes/parallel-costs.mjs';
import runnerVersions from './scenes/runner-versions.mjs';
import goodput from './scenes/goodput.mjs';
import goodputDenominator from './scenes/goodput-denominator.mjs';
import eventMetrics from './scenes/event-metrics.mjs';
import routeSecurity from './scenes/route-security.mjs';
import mediaLimits from './scenes/media-limits.mjs';
import tenantCache from './scenes/tenant-cache.mjs';
import synthesis from './scenes/synthesis.mjs';
import sourceDiagnosis from './scenes/source-diagnosis.mjs';
import projectIdentity from './scenes/project-identity.mjs';
import freshAdmission from './scenes/fresh-admission.mjs';

export default cinematicLesson({
  id: 'deep-dive-vllm',
  accent: COSMOS.cyan,
  invariants: verifyVllmInvariants,
  scenes: {
    intro,
    'entry-contract': entryContract,
    fragmentation,
    blocks,
    'historical-evidence': historicalEvidence,
    'process-owners': processOwners,
    prefix,
    'prefix-limit': prefixLimit,
    'hash-context': hashContext,
    'pool-structures': poolStructures,
    budget,
    'chunk-clock': chunkClock,
    'running-preemption': runningPreemption,
    lifetime,
    'queue-order': queueOrder,
    admission,
    'runner-contract': runnerContract,
    'parallel-costs': parallelCosts,
    'runner-versions': runnerVersions,
    goodput,
    'goodput-denominator': goodputDenominator,
    'event-metrics': eventMetrics,
    'route-security': routeSecurity,
    'media-limits': mediaLimits,
    'tenant-cache': tenantCache,
    synthesis,
    'source-diagnosis': sourceDiagnosis,
    'project-identity': projectIdentity,
    'fresh-admission': freshAdmission,
  },
});
