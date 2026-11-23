import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import requestLifetime from './stages/request-lifetime.mjs';
import operator from './stages/operator.mjs';
import memory from './stages/memory.mjs';
import memoryLedger from './stages/memory-ledger.mjs';
import localBudgets from './stages/local-budgets.mjs';
import rooflineBound from './stages/roofline-bound.mjs';
import tiles from './stages/tiles.mjs';
import online from './stages/online.mjs';
import rescale from './stages/rescale.mjs';
import generalizedMerge from './stages/generalized-merge.mjs';
import emptyAndOverflow from './stages/empty-and-overflow.mjs';
import cpuCorrectness from './stages/cpu-correctness.mjs';
import backward from './stages/backward.mjs';
import backwardAlgebra from './stages/backward-algebra.mjs';
import backwardState from './stages/backward-state.mjs';
import complexityLedger from './stages/complexity-ledger.mjs';
import causal from './stages/causal.mjs';
import absoluteTileRanges from './stages/absolute-tile-ranges.mjs';
import loopOrder from './stages/loop-order.mjs';
import warpOwnership from './stages/warp-ownership.mjs';
import asyncPipeline from './stages/async-pipeline.mjs';
import blackwellReference from './stages/blackwell-reference.mjs';
import benchmarkScopes from './stages/benchmark-scopes.mjs';
import prefillDecode from './stages/prefill-decode.mjs';
import pagedContract from './stages/paged-contract.mjs';
import alignmentFailure from './stages/alignment-failure.mjs';
import backendPolicy from './stages/backend-policy.mjs';
import transfer from './stages/transfer.mjs';
import freshCacheRepair from './stages/fresh-cache-repair.mjs';
export { SCORES, VALUES } from './fixtures.mjs';
export {
  absoluteCausalPairs,
  advanceTileSlot,
  attentionBackwardRow,
  attentionInventory,
  cachedBlend,
  causalTileClass,
  finiteAccumulatorExample,
  flashExtensionFrame,
  merge,
  rescaledFirstTile,
  summarize,
  tileInventory,
  tilePipelinePrefix,
  tileStream,
  transferPrediction,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'flash-attention',
  validateModel,
  scenes: [
    intro,
    requestLifetime,
    operator,
    memory,
    memoryLedger,
    localBudgets,
    rooflineBound,
    tiles,
    online,
    rescale,
    generalizedMerge,
    emptyAndOverflow,
    cpuCorrectness,
    backward,
    backwardAlgebra,
    backwardState,
    complexityLedger,
    causal,
    absoluteTileRanges,
    loopOrder,
    warpOwnership,
    asyncPipeline,
    blackwellReference,
    benchmarkScopes,
    prefillDecode,
    pagedContract,
    alignmentFailure,
    backendPolicy,
    transfer,
    freshCacheRepair,
  ],
});
export const draw = definition.draw;
export default definition;
