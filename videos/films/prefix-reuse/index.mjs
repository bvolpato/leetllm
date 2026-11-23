import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import causalKeys from './stages/causal-keys.mjs';
import radixSplit from './stages/radix-split.mjs';
import blockBoundaries from './stages/block-boundaries.mjs';
import promptOrder from './stages/prompt-order.mjs';
import renderedIdentity from './stages/rendered-identity.mjs';
import publication from './stages/publication.mjs';
import hostedBoundaries from './stages/hosted-boundaries.mjs';
import lookupWindow from './stages/lookup-window.mjs';
import usageBuckets from './stages/usage-buckets.mjs';
import writeEconomics from './stages/write-economics.mjs';
import partialWrites from './stages/partial-writes.mjs';
import workerLocality from './stages/worker-locality.mjs';
import latencyPath from './stages/latency-path.mjs';
import telemetrySlices from './stages/telemetry-slices.mjs';
import isolation from './stages/isolation.mjs';
import isolationProbes from './stages/isolation-probes.mjs';
import pool from './stages/pool.mjs';
import poolHeadroom from './stages/pool-headroom.mjs';
import savings from './stages/savings.mjs';
import diagnoseReplay from './stages/diagnose-replay.mjs';
import freshBudget from './stages/fresh-budget.mjs';
export {
  chain,
  fullBlockPrefix,
  guideWork,
  longestLookup,
  ownershipAfter,
  priceInput,
  reusableTokens,
} from './arithmetic.mjs';
export { sampleModel, scopedKey, validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'prefix-reuse',
  validateModel,
  scenes: [
    intro,
    causalKeys,
    radixSplit,
    blockBoundaries,
    promptOrder,
    renderedIdentity,
    publication,
    hostedBoundaries,
    lookupWindow,
    usageBuckets,
    writeEconomics,
    partialWrites,
    workerLocality,
    latencyPath,
    telemetrySlices,
    isolation,
    isolationProbes,
    pool,
    poolHeadroom,
    savings,
    diagnoseReplay,
    freshBudget,
  ],
});
export const draw = definition.draw;
export default definition;
