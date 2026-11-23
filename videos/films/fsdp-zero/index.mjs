import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import ledger from './stages/ledger.mjs';
import realLedger from './stages/real-ledger.mjs';
import weightedDdp from './stages/weighted-ddp.mjs';
import zero1 from './stages/zero1.mjs';
import zero2 from './stages/zero2.mjs';
import zero3 from './stages/zero3.mjs';
import collectiveCost from './stages/collective-cost.mjs';
import lifecycle from './stages/lifecycle.mjs';
import dtypeLifecycle from './stages/dtype-lifecycle.mjs';
import fsdp2Contract from './stages/fsdp2-contract.mjs';
import tradeoff from './stages/tradeoff.mjs';
import granularity from './stages/granularity.mjs';
import topologyLinks from './stages/topology-links.mjs';
import hybrid from './stages/hybrid.mjs';
import checkpoint from './stages/checkpoint.mjs';
import offload from './stages/offload.mjs';
import mesh from './stages/mesh.mjs';
import tensorParallel from './stages/tensor-parallel.mjs';
import pipeline from './stages/pipeline.mjs';
import contextParallel from './stages/context-parallel.mjs';
import profileContract from './stages/profile-contract.mjs';
import choose from './stages/choose.mjs';
import sizingTransfer from './stages/sizing-transfer.mjs';
export { BASE, GRADIENT_CONTRIBUTIONS, SHARDS } from './fixtures.mjs';
export {
  adamContinuation,
  capacitySnapshot,
  contextAttentionConstruction,
  onlineAttention,
  parameterSyncPosition,
  perRank,
  pipelineSchedule,
  pipelineVisibleTicks,
  recipeLedger,
  reduceScatter,
  stageSnapshot,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'fsdp-zero',
  validateModel,
  scenes: [
    intro,
    realLedger,
    weightedDdp,
    ledger,
    zero1,
    zero2,
    zero3,
    collectiveCost,
    lifecycle,
    dtypeLifecycle,
    fsdp2Contract,
    tradeoff,
    granularity,
    topologyLinks,
    hybrid,
    checkpoint,
    offload,
    mesh,
    tensorParallel,
    pipeline,
    contextParallel,
    profileContract,
    choose,
    sizingTransfer,
  ],
});
export const draw = definition.draw;
export default definition;
