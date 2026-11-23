import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import causalKeys from './scenes/causal-keys.mjs';
import radixSplit from './scenes/radix-split.mjs';
import blockBoundaries from './scenes/block-boundaries.mjs';
import promptOrder from './scenes/prompt-order.mjs';
import renderedIdentity from './scenes/rendered-identity.mjs';
import publication from './scenes/publication.mjs';
import hostedBoundaries from './scenes/hosted-boundaries.mjs';
import lookupWindow from './scenes/lookup-window.mjs';
import usageBuckets from './scenes/usage-buckets.mjs';
import writeEconomics from './scenes/write-economics.mjs';
import partialWrites from './scenes/partial-writes.mjs';
import workerLocality from './scenes/worker-locality.mjs';
import latencyPath from './scenes/latency-path.mjs';
import telemetrySlices from './scenes/telemetry-slices.mjs';
import isolation from './scenes/isolation.mjs';
import isolationProbes from './scenes/isolation-probes.mjs';
import pool from './scenes/pool.mjs';
import poolHeadroom from './scenes/pool-headroom.mjs';
import savings from './scenes/savings.mjs';
import diagnoseReplay from './scenes/diagnose-replay.mjs';
import freshBudget from './scenes/fresh-budget.mjs';

export default narratedLesson({
  id: 'prefix-reuse',
  scenes: {
    intro,
    'causal-keys': causalKeys,
    'radix-split': radixSplit,
    'block-boundaries': blockBoundaries,
    'prompt-order': promptOrder,
    'rendered-identity': renderedIdentity,
    publication,
    'hosted-boundaries': hostedBoundaries,
    'lookup-window': lookupWindow,
    'usage-buckets': usageBuckets,
    'write-economics': writeEconomics,
    'partial-writes': partialWrites,
    'worker-locality': workerLocality,
    'latency-path': latencyPath,
    'telemetry-slices': telemetrySlices,
    isolation,
    'isolation-probes': isolationProbes,
    pool,
    'pool-headroom': poolHeadroom,
    savings,
    'diagnose-replay': diagnoseReplay,
    'fresh-budget': freshBudget,
  },
});
