import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import secretProbe from './stages/secret-probe.mjs';
import contractBoundary from './stages/contract-boundary.mjs';
import domainWire from './stages/domain-wire.mjs';
import candidateValidation from './stages/candidate-validation.mjs';
import parserLayers from './stages/parser-layers.mjs';
import failureReceipt from './stages/failure-receipt.mjs';
import timeoutContract from './stages/timeout-contract.mjs';
import timeoutRetry from './stages/timeout-retry.mjs';
import admissionLimits from './stages/admission-limits.mjs';
import jitterGeometry from './stages/jitter-geometry.mjs';
import deadlineFloor from './stages/deadline-floor.mjs';
import circuitBreaker from './stages/circuit-breaker.mjs';
import breakerClock from './stages/breaker-clock.mjs';
import idempotency from './stages/idempotency.mjs';
import writeUncertainty from './stages/write-uncertainty.mjs';
import formatContract from './stages/format-contract.mjs';
import sdkWire from './stages/sdk-wire.mjs';
import streaming from './stages/streaming.mjs';
import streamEvents from './stages/stream-events.mjs';
import streamFailures from './stages/stream-failures.mjs';
import costPrivacy from './stages/cost-privacy.mjs';
import usageSubsets from './stages/usage-subsets.mjs';
import telemetryScope from './stages/telemetry-scope.mjs';
import executionShapes from './stages/execution-shapes.mjs';
import freshRequest from './stages/fresh-request.mjs';
export {
  apiChapterState,
  breakerConstruction,
  costConstruction,
  retryConstruction,
  sampleModel,
  timeoutSnapshot,
} from './construction.mjs';
export {
  breakerSnapshot,
  checkRotation,
  classifyFailure,
  costTrace,
  idempotentJobTrace,
  redactedTelemetry,
  retryPlan,
  streamSnapshot,
  validationCases,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'calling-llm-apis-production',
  validateModel,
  scenes: [
    opening,
    secretProbe,
    contractBoundary,
    domainWire,
    candidateValidation,
    parserLayers,
    failureReceipt,
    timeoutContract,
    timeoutRetry,
    admissionLimits,
    jitterGeometry,
    deadlineFloor,
    circuitBreaker,
    breakerClock,
    idempotency,
    writeUncertainty,
    formatContract,
    sdkWire,
    streaming,
    streamEvents,
    streamFailures,
    costPrivacy,
    usageSubsets,
    telemetryScope,
    executionShapes,
    freshRequest,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
const individuallyFramed = new Set(
  [
    opening,
    secretProbe,
    jitterGeometry,
    deadlineFloor,
    breakerClock,
    streamFailures,
    usageSubsets,
    freshRequest,
  ].map((stage) => stage.id),
);
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  if (!painter) throw new Error('Unknown API chapter ' + scene.id);
  if (individuallyFramed.has(scene.id)) return painter(ctx, scene, state, api);
  api.focus.target('ap-' + scene.id + '-trace', () => {
    painter(ctx, scene, state, api);
  });
  if (scene.id === 'idempotency' || scene.id === 'write-uncertainty')
    api.text(ctx, 'T-17 · account 10234 · intent 7e3b', 960, 250, 23, api.C.muted, 'center');
}
export default Object.freeze({
  ...definition,
  draw,
});
