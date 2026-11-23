import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import openingStage from './stages/opening.mjs';
import eventContractStage from './stages/event-contract.mjs';
import joinStage from './stages/join.mjs';
import reviewAsofStage from './stages/review-asof.mjs';
import denominatorsStage from './stages/denominators.mjs';
import unknownBoundsStage from './stages/unknown-bounds.mjs';
import latencyStage from './stages/latency.mjs';
import streamContractStage from './stages/stream-contract.mjs';
import percentileContractStage from './stages/percentile-contract.mjs';
import signalsRuntimeStage from './stages/signals-runtime.mjs';
import traceStage from './stages/trace.mjs';
import wireContextStage from './stages/wire-context.mjs';
import attributeContractStage from './stages/attribute-contract.mjs';
import costStage from './stages/cost.mjs';
import usageContractStage from './stages/usage-contract.mjs';
import privacyStage from './stages/privacy.mjs';
import metadataBoundaryStage from './stages/metadata-boundary.mjs';
import samplingStage from './stages/sampling.mjs';
import alertValidityStage from './stages/alert-validity.mjs';
import tailTimingStage from './stages/tail-timing.mjs';
import sampleWeightsStage from './stages/sample-weights.mjs';
import budgetStage from './stages/budget.mjs';
import historyGrowthStage from './stages/history-growth.mjs';
import toolContractStage from './stages/tool-contract.mjs';
import incidentReplayStage from './stages/incident-replay.mjs';
import candidateGateStage from './stages/candidate-gate.mjs';
import freshWindowStage from './stages/fresh-window.mjs';
export { EVENTS, MONITOR_POLICY } from './fixtures.mjs';
export {
  alert,
  estimate,
  exportRecord,
  guardedDispatch,
  joinReviews,
  repeatCount,
  summarize,
  unsafeServeBounds,
} from './arithmetic.mjs';
export {
  boundConstruction,
  costConstruction,
  denominatorConstruction,
  exportSelection,
  freshAdmissionConstruction,
  observationCue,
  sampleModel,
} from './construction.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'observability-monitoring-llm-systems',
  validateModel,
  scenes: [
    openingStage,
    eventContractStage,
    joinStage,
    reviewAsofStage,
    denominatorsStage,
    unknownBoundsStage,
    latencyStage,
    streamContractStage,
    percentileContractStage,
    signalsRuntimeStage,
    traceStage,
    wireContextStage,
    attributeContractStage,
    costStage,
    usageContractStage,
    privacyStage,
    metadataBoundaryStage,
    alertValidityStage,
    samplingStage,
    tailTimingStage,
    sampleWeightsStage,
    budgetStage,
    historyGrowthStage,
    toolContractStage,
    freshWindowStage,
    incidentReplayStage,
    candidateGateStage,
  ],
});
export const draw = definition.draw;
export default definition;
