import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import projectLineageStage from './stages/project-lineage.mjs';
import pointersStage from './stages/pointers.mjs';
import layoutPayloadStage from './stages/layout-payload.mjs';
import pagesStage from './stages/pages.mjs';
import pagePermutationStage from './stages/page-permutation.mjs';
import causalStage from './stages/causal.mjs';
import causalRuleStage from './stages/causal-rule.mjs';
import mergeStage from './stages/merge.mjs';
import mergeRecurrenceStage from './stages/merge-recurrence.mjs';
import mergeUnitsStage from './stages/merge-units.mjs';
import mergeDomainStage from './stages/merge-domain.mjs';
import mergePartitionStage from './stages/merge-partition.mjs';
import planningStage from './stages/planning.mjs';
import wrapperCallStage from './stages/wrapper-call.mjs';
import offsetMigrationStage from './stages/offset-migration.mjs';
import graphContractStage from './stages/graph-contract.mjs';
import synthesisStage from './stages/synthesis.mjs';
import splitScheduleStage from './stages/split-schedule.mjs';
import backendSupportStage from './stages/backend-support.mjs';
import startupLoggingStage from './stages/startup-logging.mjs';
import integrationLeaseStage from './stages/integration-lease.mjs';
import correctnessMatrixStage from './stages/correctness-matrix.mjs';
import profileBoundaryStage from './stages/profile-boundary.mjs';
import paperEvidenceStage from './stages/paper-evidence.mjs';
import sourceRouteStage from './stages/source-route.mjs';
import featureLimitsStage from './stages/feature-limits.mjs';
import freshTailStage from './stages/fresh-tail.mjs';
export { merge, mergeReference } from './arithmetic.mjs';
export {
  flashCue,
  flashinferExtensionFrame,
  mergeConstruction,
  pageLookupFrame,
  sampleModel,
} from './construction.mjs';
export { address } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-flashinfer',
  validateModel,
  scenes: [
    introStage,
    pointersStage,
    pagesStage,
    pagePermutationStage,
    causalStage,
    causalRuleStage,
    mergeStage,
    mergeRecurrenceStage,
    mergeUnitsStage,
    mergeDomainStage,
    mergePartitionStage,
    layoutPayloadStage,
    planningStage,
    projectLineageStage,
    wrapperCallStage,
    offsetMigrationStage,
    graphContractStage,
    splitScheduleStage,
    synthesisStage,
    integrationLeaseStage,
    backendSupportStage,
    startupLoggingStage,
    correctnessMatrixStage,
    profileBoundaryStage,
    paperEvidenceStage,
    sourceRouteStage,
    featureLimitsStage,
    freshTailStage,
  ],
});
export const draw = definition.draw;
export default definition;
