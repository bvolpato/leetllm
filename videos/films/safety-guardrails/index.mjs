import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { extendedGuardScenes } from './fixtures.mjs';
import { drawLegacySafety, drawExtendedSafety, drawOverviewSafety } from './compatibility.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import checksByBoundaryStage from './stages/checks-by-boundary.mjs';
import inputFixturesStage from './stages/input-fixtures.mjs';
import detectorContractStage from './stages/detector-contract.mjs';
import textAndActionPathsStage from './stages/text-and-action-paths.mjs';
import outputFixtureStage from './stages/output-fixture.mjs';
import argumentContractStage from './stages/argument-contract.mjs';
import approvalReplayStage from './stages/approval-replay.mjs';
import approvalAtomicStage from './stages/approval-atomic.mjs';
import schemaMaskStage from './stages/schema-mask.mjs';
import untrustedObservationsStage from './stages/untrusted-observations.mjs';
import canaryStreamStage from './stages/canary-stream.mjs';
import minimizeDataStage from './stages/minimize-data.mjs';
import sensitiveFormatsStage from './stages/sensitive-formats.mjs';
import claimAgreementStage from './stages/claim-agreement.mjs';
import evidenceVerdictStage from './stages/evidence-verdict.mjs';
import retrievalProofStage from './stages/retrieval-proof.mjs';
import policySnapshotStage from './stages/policy-snapshot.mjs';
import policyReloadStage from './stages/policy-reload.mjs';
import policyLiveAuthorityStage from './stages/policy-live-authority.mjs';
import orderAndLatencyStage from './stages/order-and-latency.mjs';
import budgetScheduleStage from './stages/budget-schedule.mjs';
import streamingContractStage from './stages/streaming-contract.mjs';
import asyncDeadlineStage from './stages/async-deadline.mjs';
import modelTaxonomyStage from './stages/model-taxonomy.mjs';
import measureErrorsStage from './stages/measure-errors.mjs';
import prevalenceShiftStage from './stages/prevalence-shift.mjs';
import decisionRecordsStage from './stages/decision-records.mjs';
import fallbackPolicyStage from './stages/fallback-policy.mjs';
import governanceLogsStage from './stages/governance-logs.mjs';
import freshBoundaryStage from './stages/fresh-boundary.mjs';
export { TRUSTED_DEPLOYMENT_APPROVALS } from './fixtures.mjs';
export {
  approvalFixture,
  articleAction,
  articleActionHash,
  authorizeDeployment,
  canonicalAction,
  claimAgreement,
  confusionMetrics,
  confusionTrace,
  cueConfusionTrace,
  cueMinimizedTrace,
  cuePolicySnapshot,
  deploymentContract,
  freshGuardFrame,
  guardCue,
  guardDone,
  latencySnapshot,
  minimizedTrace,
  policySnapshot,
  prevalenceCounts,
  redactContact,
  requiredCheck,
  routeRequest,
  safeDecisionLog,
  safetyBudget,
  snapshotDecision,
  streamTripwire,
  validateDetectorResult,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'safety-guardrails',
  validateModel,
  scenes: [
    subjectIntroStage,
    checksByBoundaryStage,
    inputFixturesStage,
    detectorContractStage,
    textAndActionPathsStage,
    outputFixtureStage,
    argumentContractStage,
    approvalReplayStage,
    approvalAtomicStage,
    schemaMaskStage,
    untrustedObservationsStage,
    canaryStreamStage,
    minimizeDataStage,
    sensitiveFormatsStage,
    claimAgreementStage,
    evidenceVerdictStage,
    retrievalProofStage,
    policySnapshotStage,
    policyReloadStage,
    policyLiveAuthorityStage,
    orderAndLatencyStage,
    budgetScheduleStage,
    streamingContractStage,
    asyncDeadlineStage,
    modelTaxonomyStage,
    measureErrorsStage,
    prevalenceShiftStage,
    decisionRecordsStage,
    fallbackPolicyStage,
    governanceLogsStage,
    freshBoundaryStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (['subject-intro', 'checks-by-boundary', 'decision-records'].includes(scene.id))
    return drawOverviewSafety(ctx, scene, state, api);
  if (extendedGuardScenes.has(scene.id)) return drawExtendedSafety(ctx, scene, state, api);
  return drawLegacySafety(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
