// Query Expansion, Rewriting, HyDE, Self-RAG & CRAG: Full-bleed dark cinema stage lesson (18 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyQueryExpansionInvariants } from './parts.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import rewriteForContext from './scenes/rewrite-for-context.mjs';
import vocabularyExpansion from './scenes/vocabulary-expansion.mjs';
import mergeRankedLists from './scenes/merge-ranked-lists.mjs';
import inspectRecall from './scenes/inspect-recall.mjs';
import decompositionTopology from './scenes/decomposition-topology.mjs';
import preserveTrustBoundaries from './scenes/preserve-trust-boundaries.mjs';
import stepBack from './scenes/step-back.mjs';
import hydeVectors from './scenes/hyde-vectors.mjs';
import hydeDrift from './scenes/hyde-drift.mjs';
import selfRagTokens from './scenes/self-rag-tokens.mjs';
import selfRagBranches from './scenes/self-rag-branches.mjs';
import cragRouting from './scenes/crag-routing.mjs';
import knowledgeRefinement from './scenes/knowledge-refinement.mjs';
import correctionBoundaries from './scenes/correction-boundaries.mjs';
import latencyWaterfall from './scenes/latency-waterfall.mjs';
import routeRelease from './scenes/route-release.mjs';
import exactnessAndBudget from './scenes/exactness-and-budget.mjs';

export default cinematicLesson({
  id: 'query-expansion',
  accent: COSMOS.cyan,
  invariants: verifyQueryExpansionInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'rewrite-for-context': rewriteForContext,
    'vocabulary-expansion': vocabularyExpansion,
    'merge-ranked-lists': mergeRankedLists,
    'inspect-recall': inspectRecall,
    'decomposition-topology': decompositionTopology,
    'preserve-trust-boundaries': preserveTrustBoundaries,
    'step-back': stepBack,
    'hyde-vectors': hydeVectors,
    'hyde-drift': hydeDrift,
    'self-rag-tokens': selfRagTokens,
    'self-rag-branches': selfRagBranches,
    'crag-routing': cragRouting,
    'knowledge-refinement': knowledgeRefinement,
    'correction-boundaries': correctionBoundaries,
    'latency-waterfall': latencyWaterfall,
    'route-release': routeRelease,
    'exactness-and-budget': exactnessAndBudget,
  },
});
