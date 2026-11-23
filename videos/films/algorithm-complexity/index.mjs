import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import scan from './stages/scan.mjs';
import orderedSearch from './stages/ordered-search.mjs';
import hashLookup from './stages/hash-lookup.mjs';
import radixPrefix from './stages/radix-prefix.mjs';
import amortizedAppend from './stages/amortized-append.mjs';
import vectorScore from './stages/vector-score.mjs';
import topK from './stages/top-k.mjs';
import uniquePairs from './stages/unique-pairs.mjs';
import attention from './stages/attention.mjs';
import cacheVolume from './stages/cache-volume.mjs';
import queueMeasurement from './stages/queue-measurement.mjs';
import workBudget from './stages/work-budget.mjs';
import shortlistPayoff from './stages/shortlist-payoff.mjs';
export {
  appendTrace,
  budgetFor,
  decodeCostTrace,
  dot,
  exactDedupTrace,
  hashKey,
  rank,
  unorderedPairs,
} from './arithmetic.mjs';
export { cueProgress } from './construction.mjs';
export {
  APPENDS,
  APPEND_EVENTS,
  BINARY_TRACE,
  CACHE_SHAPE,
  CATALOG,
  COLLISION_QUERY,
  DEDUP,
  DOCS,
  HASH_GRID,
  HEAP_TRACE,
  PAIRS,
  PREFIX_QUERY,
  PREFIX_WORDS,
  QUERY,
  SCORES,
  SCORE_TRACE,
  TERMS,
  TOP_TWO,
  binarySearchTrace,
  boundedHeapTrace,
  scoreTrace,
} from './fixtures.mjs';
export {
  appendSnapshot,
  batchWaitSnapshot,
  binarySnapshot,
  budgetSnapshot,
  buildRadixTree,
  cacheValueBytes,
  cacheVolumeSnapshot,
  collisionChainChecks,
  decodeSequenceSnapshot,
  hashBucketGeometry,
  heapSnapshot,
  issuerHashRouteGeometry,
  naivePrefixComparisonCount,
  openingSnapshot,
  pairSnapshot,
  radixPrefixSnapshot,
  radixPrefixTrace,
  scanSnapshot,
  scoringSnapshot,
  shortlist,
  shortlistSnapshot,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'algorithm-complexity',
  validateModel,
  scenes: [
    opening,
    scan,
    orderedSearch,
    hashLookup,
    radixPrefix,
    amortizedAppend,
    vectorScore,
    topK,
    uniquePairs,
    attention,
    cacheVolume,
    queueMeasurement,
    workBudget,
    shortlistPayoff,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id)) return;
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
