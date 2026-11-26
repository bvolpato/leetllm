// Cinematic Vizmatic 0.10.0 stage film for Deep Dive: FlashInfer (28 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyFlashInferInvariants } from './parts.mjs';
import backendSupport from './scenes/backend-support.mjs';
import causalRule from './scenes/causal-rule.mjs';
import causal from './scenes/causal.mjs';
import correctnessMatrix from './scenes/correctness-matrix.mjs';
import featureLimits from './scenes/feature-limits.mjs';
import freshTail from './scenes/fresh-tail.mjs';
import graphContract from './scenes/graph-contract.mjs';
import integrationLease from './scenes/integration-lease.mjs';
import intro from './scenes/intro.mjs';
import layoutPayload from './scenes/layout-payload.mjs';
import mergeDomain from './scenes/merge-domain.mjs';
import mergePartition from './scenes/merge-partition.mjs';
import mergeRecurrence from './scenes/merge-recurrence.mjs';
import mergeUnits from './scenes/merge-units.mjs';
import merge from './scenes/merge.mjs';
import offsetMigration from './scenes/offset-migration.mjs';
import pagePermutation from './scenes/page-permutation.mjs';
import pages from './scenes/pages.mjs';
import paperEvidence from './scenes/paper-evidence.mjs';
import planning from './scenes/planning.mjs';
import pointers from './scenes/pointers.mjs';
import profileBoundary from './scenes/profile-boundary.mjs';
import projectLineage from './scenes/project-lineage.mjs';
import sourceRoute from './scenes/source-route.mjs';
import splitSchedule from './scenes/split-schedule.mjs';
import startupLogging from './scenes/startup-logging.mjs';
import synthesis from './scenes/synthesis.mjs';
import wrapperCall from './scenes/wrapper-call.mjs';

export default cinematicLesson({
  id: 'deep-dive-flashinfer',
  accent: COSMOS.cyan,
  invariants: verifyFlashInferInvariants,
  scenes: {
    intro,
    pointers,
    pages,
    'page-permutation': pagePermutation,
    causal,
    'causal-rule': causalRule,
    merge,
    'merge-recurrence': mergeRecurrence,
    'merge-units': mergeUnits,
    'merge-domain': mergeDomain,
    'merge-partition': mergePartition,
    'layout-payload': layoutPayload,
    planning,
    'project-lineage': projectLineage,
    'wrapper-call': wrapperCall,
    'offset-migration': offsetMigration,
    'graph-contract': graphContract,
    'split-schedule': splitSchedule,
    synthesis,
    'integration-lease': integrationLease,
    'backend-support': backendSupport,
    'startup-logging': startupLogging,
    'correctness-matrix': correctnessMatrix,
    'profile-boundary': profileBoundary,
    'paper-evidence': paperEvidence,
    'source-route': sourceRoute,
    'feature-limits': featureLimits,
    'fresh-tail': freshTail,
  },
});
