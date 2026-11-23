import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import openingStage from './stages/opening.mjs';
import listStage from './stages/list.mjs';
import representationStage from './stages/representation.mjs';
import amortizedLedgerStage from './stages/amortized-ledger.mjs';
import scanStage from './stages/scan.mjs';
import scanIndexStage from './stages/scan-index.mjs';
import hashCollisionStage from './stages/hash-collision.mjs';
import membershipStage from './stages/membership.mjs';
import scoresStage from './stages/scores.mjs';
import codeContractStage from './stages/code-contract.mjs';
import heapStage from './stages/heap.mjs';
import heapOrderStage from './stages/heap-order.mjs';
import queueStage from './stages/queue.mjs';
import workersStage from './stages/workers.mjs';
import queuePolicyStage from './stages/queue-policy.mjs';
import treeStage from './stages/tree.mjs';
import graphStage from './stages/graph.mjs';
import graphCostStage from './stages/graph-cost.mjs';
import trieStage from './stages/trie.mjs';
import cacheOwnershipStage from './stages/cache-ownership.mjs';
import eligibilityStage from './stages/eligibility.mjs';
import cacheFreshnessStage from './stages/cache-freshness.mjs';
import cacheRecencyStage from './stages/cache-recency.mjs';
import operationLedgerStage from './stages/operation-ledger.mjs';
import answerStage from './stages/answer.mjs';
import invariantChecksStage from './stages/invariant-checks.mjs';
import freshPermissionStage from './stages/fresh-permission.mjs';
export { LINKS, MESSAGES, QUERY, UPDATED_MESSAGES } from './fixtures.mjs';
export {
  breadthFirstTrace,
  buildIndex,
  capacityState,
  clamp,
  collisionWorksheet,
  doublingHistory,
  eligibleTopK,
  heapTrace,
  indexedScores,
  ownershipSnapshot,
  permittedFreshRanking,
  rank,
  scoreRows,
  search,
  terms,
  toyBucket,
  weaker,
} from './arithmetic.mjs';
export {
  appendWorksheetState,
  freshnessState,
  graphWalkState,
  indexBuildState,
  q,
  scoreState,
  treeWalkState,
} from './construction.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'ai-data-structures',
  validateModel,
  scenes: [
    openingStage,
    listStage,
    representationStage,
    amortizedLedgerStage,
    scanStage,
    scanIndexStage,
    hashCollisionStage,
    membershipStage,
    scoresStage,
    heapStage,
    heapOrderStage,
    codeContractStage,
    operationLedgerStage,
    queueStage,
    workersStage,
    queuePolicyStage,
    treeStage,
    graphStage,
    graphCostStage,
    trieStage,
    invariantChecksStage,
    cacheOwnershipStage,
    eligibilityStage,
    cacheFreshnessStage,
    cacheRecencyStage,
    answerStage,
    freshPermissionStage,
  ],
});
export const draw = definition.draw;
export default definition;
