import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import evidenceControls from './stages/evidence-controls.mjs';
import stores from './stages/stores.mjs';
import storeRoute from './stages/store-route.mjs';
import metadataMutability from './stages/metadata-mutability.mjs';
import lineage from './stages/lineage.mjs';
import modelPackage from './stages/model-package.mjs';
import trace from './stages/trace.mjs';
import traceOverlap from './stages/trace-overlap.mjs';
import traceLinks from './stages/trace-links.mjs';
import contextChain from './stages/context-chain.mjs';
import evaluation from './stages/evaluation.mjs';
import citationComputation from './stages/citation-computation.mjs';
import evaluationResult from './stages/evaluation-result.mjs';
import datasetMutation from './stages/dataset-mutation.mjs';
import sdkEvidence from './stages/sdk-evidence.mjs';
import automaticEvidence from './stages/automatic-evidence.mjs';
import alias from './stages/alias.mjs';
import configMutation from './stages/config-mutation.mjs';
import cacheClock from './stages/cache-clock.mjs';
import gatewayContract from './stages/gateway-contract.mjs';
import synthesis from './stages/synthesis.mjs';
import exportQueue from './stages/export-queue.mjs';
import privacyGate from './stages/privacy-gate.mjs';
import storageLifecycle from './stages/storage-lifecycle.mjs';
import authBoundary from './stages/auth-boundary.mjs';
import projectSource from './stages/project-source.mjs';
import sourceRoute from './stages/source-route.mjs';
import freshConfig from './stages/fresh-config.mjs';
import freshTelemetry from './stages/fresh-telemetry.mjs';
export { artifactDigest, canonicalContent, mergeIntervals } from './arithmetic.mjs';
export {
  mlflowSentenceProgress,
  sampleMlflowChapter,
  sampleMlflowVisual,
  sampleModel,
} from './construction.mjs';
export { ARTIFACT_FIXTURE } from './fixtures.mjs';
export {
  assess,
  cacheClockTrace,
  compareArtifacts,
  exporter,
  exporterReceipts,
  queueTimeline,
  releaseAllowed,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-mlflow',
  validateModel,
  scenes: [
    intro,
    evidenceControls,
    stores,
    storeRoute,
    metadataMutability,
    lineage,
    modelPackage,
    trace,
    traceOverlap,
    traceLinks,
    contextChain,
    citationComputation,
    evaluation,
    evaluationResult,
    datasetMutation,
    sdkEvidence,
    automaticEvidence,
    alias,
    configMutation,
    cacheClock,
    gatewayContract,
    exportQueue,
    privacyGate,
    storageLifecycle,
    authBoundary,
    projectSource,
    sourceRoute,
    freshConfig,
    freshTelemetry,
    synthesis,
  ],
});
export function draw(ctx, scene, state, api) {
  return api.focus.target(scene.id + '-construction', () => {
    if (definition.scenes.some((stage) => stage.id === scene.id))
      return definition.draw(ctx, scene, state, api);
    throw new RangeError('No MLflow construction for ' + scene.id);
  });
}
export default Object.freeze({ ...definition, draw });
