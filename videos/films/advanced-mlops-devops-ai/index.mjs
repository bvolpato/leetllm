import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownReleaseScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import releaseBoundaryStage from './stages/release-boundary.mjs';
import gitopsContractStage from './stages/gitops-contract.mjs';
import releaseFingerprintStage from './stages/release-fingerprint.mjs';
import exactCandidateStage from './stages/exact-candidate.mjs';
import registryCacheStage from './stages/registry-cache.mjs';
import vectorsStage from './stages/vectors.mjs';
import robustNormalizationStage from './stages/robust-normalization.mjs';
import timeStage from './stages/time.mjs';
import joinAlgorithmStage from './stages/join-algorithm.mjs';
import featureInterfaceStage from './stages/feature-interface.mjs';
import budgetStage from './stages/budget.mjs';
import goldenContractStage from './stages/golden-contract.mjs';
import shadowStage from './stages/shadow.mjs';
import shadowPairsStage from './stages/shadow-pairs.mjs';
import stickyRampStage from './stages/sticky-ramp.mjs';
import controllerStage from './stages/controller.mjs';
import typedTelemetryStage from './stages/typed-telemetry.mjs';
import ruleMatrixStage from './stages/rule-matrix.mjs';
import sustainedWindowsStage from './stages/sustained-windows.mjs';
import analysisBoundaryStage from './stages/analysis-boundary.mjs';
import traceTupleStage from './stages/trace-tuple.mjs';
import localLifecycleStage from './stages/local-lifecycle.mjs';
import atomicPublicationStage from './stages/atomic-publication.mjs';
import reconcileStage from './stages/reconcile.mjs';
import workerRecoveryStage from './stages/worker-recovery.mjs';
import freshRequestStage from './stages/fresh-request.mjs';
import freshRecoveryStage from './stages/fresh-recovery.mjs';
export { FEATURE_TIME_CUES } from './fixtures.mjs';
export { digest, pythonReleaseDigest } from './arithmetic.mjs';
export {
  featureAt,
  featureImpact,
  featureWindowState,
  normalizeReleaseVector,
  temporalReleaseJoin,
} from './features.mjs';
export { decide, sampleModel } from './model.mjs';
export { guardedReleaseTransition, releaseFingerprintFixture } from './protocols.mjs';
export {
  RELEASE_RULES,
  ReleaseMetricSample,
  combineReleaseActions,
  releaseTelemetry,
  sustainedReleaseTrace,
} from './telemetry.mjs';
export { freshReleaseState, releaseSentenceProgress } from './construction.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'advanced-mlops-devops-ai',
  validateModel,
  scenes: [
    introStage,
    releaseBoundaryStage,
    gitopsContractStage,
    releaseFingerprintStage,
    exactCandidateStage,
    registryCacheStage,
    vectorsStage,
    robustNormalizationStage,
    timeStage,
    joinAlgorithmStage,
    featureInterfaceStage,
    budgetStage,
    goldenContractStage,
    shadowStage,
    shadowPairsStage,
    stickyRampStage,
    controllerStage,
    typedTelemetryStage,
    ruleMatrixStage,
    sustainedWindowsStage,
    analysisBoundaryStage,
    traceTupleStage,
    localLifecycleStage,
    atomicPublicationStage,
    freshRequestStage,
    freshRecoveryStage,
    workerRecoveryStage,
    reconcileStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : drawUnknownReleaseScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
