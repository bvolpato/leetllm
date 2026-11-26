// Cinematic Vizmatic 0.10.0 stage film for FlashAttention (30 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyFlashInvariants } from './parts.mjs';
import absoluteTileRanges from './scenes/absolute-tile-ranges.mjs';
import alignmentFailure from './scenes/alignment-failure.mjs';
import asyncPipeline from './scenes/async-pipeline.mjs';
import backendPolicy from './scenes/backend-policy.mjs';
import backwardAlgebra from './scenes/backward-algebra.mjs';
import backwardState from './scenes/backward-state.mjs';
import backward from './scenes/backward.mjs';
import benchmarkScopes from './scenes/benchmark-scopes.mjs';
import blackwellReference from './scenes/blackwell-reference.mjs';
import causal from './scenes/causal.mjs';
import complexityLedger from './scenes/complexity-ledger.mjs';
import cpuCorrectness from './scenes/cpu-correctness.mjs';
import emptyAndOverflow from './scenes/empty-and-overflow.mjs';
import freshCacheRepair from './scenes/fresh-cache-repair.mjs';
import generalizedMerge from './scenes/generalized-merge.mjs';
import intro from './scenes/intro.mjs';
import localBudgets from './scenes/local-budgets.mjs';
import loopOrder from './scenes/loop-order.mjs';
import memoryLedger from './scenes/memory-ledger.mjs';
import memory from './scenes/memory.mjs';
import online from './scenes/online.mjs';
import operator from './scenes/operator.mjs';
import pagedContract from './scenes/paged-contract.mjs';
import prefillDecode from './scenes/prefill-decode.mjs';
import requestLifetime from './scenes/request-lifetime.mjs';
import rescale from './scenes/rescale.mjs';
import rooflineBound from './scenes/roofline-bound.mjs';
import tiles from './scenes/tiles.mjs';
import transfer from './scenes/transfer.mjs';
import warpOwnership from './scenes/warp-ownership.mjs';

export default cinematicLesson({
  id: 'flash-attention',
  accent: COSMOS.cyan,
  invariants: verifyFlashInvariants,
  scenes: {
    intro,
    'request-lifetime': requestLifetime,
    operator,
    memory,
    'memory-ledger': memoryLedger,
    'local-budgets': localBudgets,
    'roofline-bound': rooflineBound,
    tiles,
    online,
    rescale,
    'generalized-merge': generalizedMerge,
    'empty-and-overflow': emptyAndOverflow,
    'cpu-correctness': cpuCorrectness,
    backward,
    'backward-algebra': backwardAlgebra,
    'backward-state': backwardState,
    'complexity-ledger': complexityLedger,
    causal,
    'absolute-tile-ranges': absoluteTileRanges,
    'loop-order': loopOrder,
    'warp-ownership': warpOwnership,
    'async-pipeline': asyncPipeline,
    'blackwell-reference': blackwellReference,
    'benchmark-scopes': benchmarkScopes,
    'prefill-decode': prefillDecode,
    'paged-contract': pagedContract,
    'alignment-failure': alignmentFailure,
    'backend-policy': backendPolicy,
    transfer,
    'fresh-cache-repair': freshCacheRepair,
  },
});
