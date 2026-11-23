import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import rewriteForContext from './stages/rewrite-for-context.mjs';
import vocabularyExpansion from './stages/vocabulary-expansion.mjs';
import mergeRankedLists from './stages/merge-ranked-lists.mjs';
import inspectRecall from './stages/inspect-recall.mjs';
import decompositionTopology from './stages/decomposition-topology.mjs';
import preserveTrustBoundaries from './stages/preserve-trust-boundaries.mjs';
import stepBack from './stages/step-back.mjs';
import hydeVectors from './stages/hyde-vectors.mjs';
import hydeDrift from './stages/hyde-drift.mjs';
import selfRagTokens from './stages/self-rag-tokens.mjs';
import selfRagBranches from './stages/self-rag-branches.mjs';
import cragRouting from './stages/crag-routing.mjs';
import knowledgeRefinement from './stages/knowledge-refinement.mjs';
import correctionBoundaries from './stages/correction-boundaries.mjs';
import latencyWaterfall from './stages/latency-waterfall.mjs';
import routeRelease from './stages/route-release.mjs';
import exactnessAndBudget from './stages/exactness-and-budget.mjs';
export { meanEmbedding, nearestRank, supportScore } from './arithmetic.mjs';
export {
  CRITIQUE_BRANCHES,
  CRITIQUE_WEIGHTS,
  HYDE_MEAN,
  HYDE_PROXIES,
  LATENCY_STAGES,
  LATENCY_TRACES,
  PROXY_CORPUS,
  RELEASE_ROUTES,
} from './fixtures.mjs';
export {
  accessConstruction,
  budgetConstruction,
  correctionPath,
  decomposeDependencies,
  decompositionTrace,
  eligibleRoutes,
  exactQueryRoute,
  expandQueries,
  fusionTrace,
  proxyEvidence,
  recallSnapshot,
  reciprocalRankFusion,
  requestBudget,
  retrievalRun,
  rewriteSnapshot,
  search,
  variantConstruction,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'query-expansion',
  validateModel,
  scenes: [
    subjectIntro,
    rewriteForContext,
    vocabularyExpansion,
    mergeRankedLists,
    inspectRecall,
    decompositionTopology,
    preserveTrustBoundaries,
    stepBack,
    hydeVectors,
    hydeDrift,
    selfRagTokens,
    selfRagBranches,
    cragRouting,
    knowledgeRefinement,
    correctionBoundaries,
    latencyWaterfall,
    routeRelease,
    exactnessAndBudget,
  ],
});
export const draw = definition.draw;
export default definition;
