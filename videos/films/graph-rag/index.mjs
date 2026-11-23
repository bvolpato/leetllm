import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import triplesStage from './stages/triples.mjs';
import extractionContractStage from './stages/extraction-contract.mjs';
import resolveIdentityStage from './stages/resolve-identity.mjs';
import walkEvidenceStage from './stages/walk-evidence.mjs';
import unsupportedEdgeStage from './stages/unsupported-edge.mjs';
import communityConstructionStage from './stages/community-construction.mjs';
import communityOverviewStage from './stages/community-overview.mjs';
import localContextBudgetStage from './stages/local-context-budget.mjs';
import dynamicSelectionStage from './stages/dynamic-selection.mjs';
import driftFollowupsStage from './stages/drift-followups.mjs';
import indexStrategiesStage from './stages/index-strategies.mjs';
import workloadCostStage from './stages/workload-cost.mjs';
import incidentComparisonStage from './stages/incident-comparison.mjs';
import countsAndAccessStage from './stages/counts-and-access.mjs';
import transferStage from './stages/transfer.mjs';
export { CLUSTER_EDGES, CONTEXT_CANDIDATES, EDGES, RECORDS } from './fixtures.mjs';
export {
  blockedDescendants,
  communitySnapshot,
  dynamicTree,
  entails,
  evidenceTrace,
  graphUpgradeModel,
  identityResolutionState,
  modularityTerms,
  packContext,
  reportAudience,
  sourceRefreshState,
  supportChallengeState,
  tripleConstructionState,
  validateModel,
  walk,
  workloadCost,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'graph-rag',
  validateModel,
  scenes: [
    subjectIntroStage,
    triplesStage,
    resolveIdentityStage,
    walkEvidenceStage,
    unsupportedEdgeStage,
    extractionContractStage,
    incidentComparisonStage,
    communityConstructionStage,
    communityOverviewStage,
    localContextBudgetStage,
    dynamicSelectionStage,
    driftFollowupsStage,
    indexStrategiesStage,
    workloadCostStage,
    countsAndAccessStage,
    transferStage,
  ],
});
export const draw = definition.draw;
export default definition;
