import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownSlimeScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import incidentReceiptStage from './stages/incident-receipt.mjs';
import ledgerStage from './stages/ledger.mjs';
import sampleChecksStage from './stages/sample-checks.mjs';
import nativeAppendStage from './stages/native-append.mjs';
import identityGroupsStage from './stages/identity-groups.mjs';
import segmentsStage from './stages/segments.mjs';
import stepDenominatorStage from './stages/step-denominator.mjs';
import placementStage from './stages/placement.mjs';
import bundleMapStage from './stages/bundle-map.mjs';
import routerSessionStage from './stages/router-session.mjs';
import roundBoundariesStage from './stages/round-boundaries.mjs';
import asyncFutureStage from './stages/async-future.mjs';
import queueStage from './stages/queue.mjs';
import queueHandoffStage from './stages/queue-handoff.mjs';
import syncStage from './stages/sync.mjs';
import syncDispatchStage from './stages/sync-dispatch.mjs';
import broadcastLifecycleStage from './stages/broadcast-lifecycle.mjs';
import diskRetentionStage from './stages/disk-retention.mjs';
import deltaStage from './stages/delta.mjs';
import deltaRecordStage from './stages/delta-record.mjs';
import agentHookStage from './stages/agent-hook.mjs';
import applicationExperimentStage from './stages/application-experiment.mjs';
import failureDiagnosisStage from './stages/failure-diagnosis.mjs';
import recoveryStage from './stages/recovery.mjs';
import retainedServingStage from './stages/retained-serving.mjs';
import debugReplayStage from './stages/debug-replay.mjs';
import projectScopeStage from './stages/project-scope.mjs';
import sourceRouteStage from './stages/source-route.mjs';
import freshReplayStage from './stages/fresh-replay.mjs';
export { momentumTrace, update, xor } from './arithmetic.mjs';
export { applyPatch, chooseSlimeCarrier, drainGroups, syncState } from './protocols.mjs';
export {
  queueState,
  sampleModel,
  segmentState,
  syncTeachingState,
  validateSample,
} from './model.mjs';
export { sampleSlimeChapter, slimeSentenceProgress } from './construction.mjs';
export { validateModel, validateSlimeChapters } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-slime',
  validateModel,
  scenes: [
    introStage,
    incidentReceiptStage,
    ledgerStage,
    sampleChecksStage,
    nativeAppendStage,
    identityGroupsStage,
    segmentsStage,
    stepDenominatorStage,
    placementStage,
    bundleMapStage,
    routerSessionStage,
    roundBoundariesStage,
    asyncFutureStage,
    queueStage,
    queueHandoffStage,
    syncStage,
    syncDispatchStage,
    broadcastLifecycleStage,
    diskRetentionStage,
    deltaStage,
    deltaRecordStage,
    agentHookStage,
    applicationExperimentStage,
    projectScopeStage,
    sourceRouteStage,
    failureDiagnosisStage,
    recoveryStage,
    retainedServingStage,
    debugReplayStage,
    freshReplayStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter ? painter(ctx, scene, state, api) : drawUnknownSlimeScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
