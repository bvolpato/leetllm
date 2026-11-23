import { guardCue, guardDone } from './model.mjs';
import { paintSubjectIntroLegacy } from './stages/subject-intro.mjs';
import { paintChecksByBoundaryLegacy } from './stages/checks-by-boundary.mjs';
import { paintTextAndActionPaths } from './stages/text-and-action-paths.mjs';
import { paintPolicySnapshot } from './stages/policy-snapshot.mjs';
import { paintMinimizeData } from './stages/minimize-data.mjs';
import { paintOrderAndLatency } from './stages/order-and-latency.mjs';
import { paintMeasureErrors } from './stages/measure-errors.mjs';
import { paintDecisionRecordsLegacy } from './stages/decision-records.mjs';
import { paintInputFixtures } from './stages/input-fixtures.mjs';
import { paintDetectorContract } from './stages/detector-contract.mjs';
import { paintOutputFixture } from './stages/output-fixture.mjs';
import { paintArgumentContract } from './stages/argument-contract.mjs';
import { paintApprovalReplay } from './stages/approval-replay.mjs';
import { paintApprovalAtomic } from './stages/approval-atomic.mjs';
import { paintSchemaMask } from './stages/schema-mask.mjs';
import { paintUntrustedObservations } from './stages/untrusted-observations.mjs';
import { paintCanaryStream } from './stages/canary-stream.mjs';
import { paintSensitiveFormats } from './stages/sensitive-formats.mjs';
import { paintClaimAgreement } from './stages/claim-agreement.mjs';
import { paintEvidenceVerdict } from './stages/evidence-verdict.mjs';
import { paintRetrievalProof } from './stages/retrieval-proof.mjs';
import { paintPolicyReload } from './stages/policy-reload.mjs';
import { paintPolicyLiveAuthority } from './stages/policy-live-authority.mjs';
import { paintBudgetSchedule } from './stages/budget-schedule.mjs';
import { paintStreamingContract } from './stages/streaming-contract.mjs';
import { paintAsyncDeadline } from './stages/async-deadline.mjs';
import { paintModelTaxonomy } from './stages/model-taxonomy.mjs';
import { paintPrevalenceShift } from './stages/prevalence-shift.mjs';
import { paintFallbackPolicy } from './stages/fallback-policy.mjs';
import { paintGovernanceLogs } from './stages/governance-logs.mjs';
import { paintFreshBoundary } from './stages/fresh-boundary.mjs';
import { paintSubjectIntro } from './stages/subject-intro.mjs';
import { paintChecksByBoundary } from './stages/checks-by-boundary.mjs';
import { paintDecisionRecords } from './stages/decision-records.mjs';
export function drawLegacySafety(ctx, scene, state, api) {
  const { C: themeColors, components: c, phase, teaching: t } = api;
  const currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    routeProgress = phase(beatProgress, 0.05, 0.9);
  if (scene.id === 'subject-intro') {
    return paintSubjectIntroLegacy(ctx, scene, state, api, themeColors, c, t, routeProgress);
  } else if (scene.id === 'checks-by-boundary') {
    return paintChecksByBoundaryLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      currentBeat,
      routeProgress,
    );
  } else if (scene.id === 'text-and-action-paths') {
    return paintTextAndActionPaths(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      currentBeat,
      routeProgress,
    );
  } else if (scene.id === 'policy-snapshot') {
    return paintPolicySnapshot(ctx, scene, state, api, themeColors, c, t, routeProgress);
  } else if (scene.id === 'minimize-data') {
    return paintMinimizeData(ctx, scene, state, api, themeColors, c, t, currentBeat, routeProgress);
  } else if (scene.id === 'order-and-latency') {
    return paintOrderAndLatency(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      currentBeat,
      beatProgress,
    );
  } else if (scene.id === 'measure-errors') {
    return paintMeasureErrors(ctx, scene, state, api, themeColors, t, currentBeat);
  } else if (scene.id === 'decision-records') {
    return paintDecisionRecordsLegacy(ctx, scene, state, api, themeColors, c, t, routeProgress);
  } else {
    throw new Error(`Unknown safety-guardrails scene: ${scene.id}`);
  }
}
export function drawExtendedSafety(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  if (scene.id === 'input-fixtures') {
    return paintInputFixtures(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'detector-contract') {
    return paintDetectorContract(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'output-fixture') {
    return paintOutputFixture(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'argument-contract') {
    return paintArgumentContract(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'approval-replay') {
    return paintApprovalReplay(ctx, scene, state, api, themeColors, currentBeat, cueDone);
  } else if (scene.id === 'approval-atomic') {
    return paintApprovalAtomic(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'schema-mask') {
    return paintSchemaMask(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
  } else if (scene.id === 'untrusted-observations') {
    return paintUntrustedObservations(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'canary-stream') {
    return paintCanaryStream(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'sensitive-formats') {
    return paintSensitiveFormats(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
  } else if (scene.id === 'claim-agreement') {
    return paintClaimAgreement(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'evidence-verdict') {
    return paintEvidenceVerdict(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'retrieval-proof') {
    return paintRetrievalProof(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'policy-reload') {
    return paintPolicyReload(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
  } else if (scene.id === 'policy-live-authority') {
    return paintPolicyLiveAuthority(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'budget-schedule') {
    return paintBudgetSchedule(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
  } else if (scene.id === 'streaming-contract') {
    return paintStreamingContract(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
  } else if (scene.id === 'async-deadline') {
    return paintAsyncDeadline(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'model-taxonomy') {
    return paintModelTaxonomy(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
  } else if (scene.id === 'prevalence-shift') {
    return paintPrevalenceShift(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'fallback-policy') {
    return paintFallbackPolicy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      currentBeat,
      cueProgress,
      cueDone,
    );
  } else if (scene.id === 'governance-logs') {
    return paintGovernanceLogs(ctx, scene, state, api, themeColors, currentBeat);
  } else if (scene.id === 'fresh-boundary') {
    return paintFreshBoundary(ctx, scene, state, api, themeColors, currentBeat);
  } else throw Error('Unknown extended guard scene ' + scene.id);
}
export function drawOverviewSafety(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  if (scene.id === 'subject-intro') {
    return paintSubjectIntro(ctx, scene, state, api, themeColors, currentBeat);
  } else if (scene.id === 'checks-by-boundary') {
    return paintChecksByBoundary(ctx, scene, state, api, themeColors, currentBeat);
  } else {
    return paintDecisionRecords(ctx, scene, state, api, themeColors, currentBeat);
  }
}
