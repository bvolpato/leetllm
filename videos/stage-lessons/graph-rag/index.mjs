// Following Evidence Through a Graph (GraphRAG): Full-bleed dark cinema stage lesson (16 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyGraphRagInvariants } from './parts.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import triples from './scenes/triples.mjs';
import resolveIdentity from './scenes/resolve-identity.mjs';
import walkEvidence from './scenes/walk-evidence.mjs';
import unsupportedEdge from './scenes/unsupported-edge.mjs';
import extractionContract from './scenes/extraction-contract.mjs';
import incidentComparison from './scenes/incident-comparison.mjs';
import communityConstruction from './scenes/community-construction.mjs';
import communityOverview from './scenes/community-overview.mjs';
import localContextBudget from './scenes/local-context-budget.mjs';
import dynamicSelection from './scenes/dynamic-selection.mjs';
import driftFollowups from './scenes/drift-followups.mjs';
import indexStrategies from './scenes/index-strategies.mjs';
import workloadCost from './scenes/workload-cost.mjs';
import countsAndAccess from './scenes/counts-and-access.mjs';
import transfer from './scenes/transfer.mjs';

export default cinematicLesson({
  id: 'graph-rag',
  accent: COSMOS.emerald,
  invariants: verifyGraphRagInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    triples,
    'resolve-identity': resolveIdentity,
    'walk-evidence': walkEvidence,
    'unsupported-edge': unsupportedEdge,
    'extraction-contract': extractionContract,
    'incident-comparison': incidentComparison,
    'community-construction': communityConstruction,
    'community-overview': communityOverview,
    'local-context-budget': localContextBudget,
    'dynamic-selection': dynamicSelection,
    'drift-followups': driftFollowups,
    'index-strategies': indexStrategies,
    'workload-cost': workloadCost,
    'counts-and-access': countsAndAccess,
    transfer,
  },
});
