// Cinematic Vizmatic 0.10.0 stage film for Distributed Training: FSDP & ZeRO (24 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyFsdpInvariants } from './parts.mjs';
import checkpoint from './scenes/checkpoint.mjs';
import choose from './scenes/choose.mjs';
import collectiveCost from './scenes/collective-cost.mjs';
import contextParallel from './scenes/context-parallel.mjs';
import dtypeLifecycle from './scenes/dtype-lifecycle.mjs';
import fsdp2Contract from './scenes/fsdp2-contract.mjs';
import granularity from './scenes/granularity.mjs';
import hybrid from './scenes/hybrid.mjs';
import intro from './scenes/intro.mjs';
import ledger from './scenes/ledger.mjs';
import lifecycle from './scenes/lifecycle.mjs';
import mesh from './scenes/mesh.mjs';
import offload from './scenes/offload.mjs';
import pipeline from './scenes/pipeline.mjs';
import profileContract from './scenes/profile-contract.mjs';
import realLedger from './scenes/real-ledger.mjs';
import sizingTransfer from './scenes/sizing-transfer.mjs';
import tensorParallel from './scenes/tensor-parallel.mjs';
import topologyLinks from './scenes/topology-links.mjs';
import tradeoff from './scenes/tradeoff.mjs';
import weightedDdp from './scenes/weighted-ddp.mjs';
import zero1 from './scenes/zero1.mjs';
import zero2 from './scenes/zero2.mjs';
import zero3 from './scenes/zero3.mjs';

export default cinematicLesson({
  id: 'fsdp-zero',
  accent: COSMOS.cyan,
  invariants: verifyFsdpInvariants,
  scenes: {
    intro,
    'real-ledger': realLedger,
    'weighted-ddp': weightedDdp,
    ledger,
    zero1,
    zero2,
    zero3,
    'collective-cost': collectiveCost,
    lifecycle,
    'dtype-lifecycle': dtypeLifecycle,
    'fsdp2-contract': fsdp2Contract,
    tradeoff,
    granularity,
    'topology-links': topologyLinks,
    hybrid,
    checkpoint,
    offload,
    mesh,
    'tensor-parallel': tensorParallel,
    pipeline,
    'context-parallel': contextParallel,
    'profile-contract': profileContract,
    choose,
    'sizing-transfer': sizingTransfer,
  },
});
