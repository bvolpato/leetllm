import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import workloadFreezeStage from './stages/workload-freeze.mjs';
import arrivalScheduleStage from './stages/arrival-schedule.mjs';
import generatorClockStage from './stages/generator-clock.mjs';
import rateAndConcurrencyStage from './stages/rate-and-concurrency.mjs';
import arrivalFamiliesStage from './stages/arrival-families.mjs';
import runWindowStage from './stages/run-window.mjs';
import streamTimingStage from './stages/stream-timing.mjs';
import singleTokenStage from './stages/single-token.mjs';
import chunkBoundariesStage from './stages/chunk-boundaries.mjs';
import adapterContractStage from './stages/adapter-contract.mjs';
import playbackDeadlinesStage from './stages/playback-deadlines.mjs';
import requestDenominatorStage from './stages/request-denominator.mjs';
import scorerContractStage from './stages/scorer-contract.mjs';
import scorerRepairStage from './stages/scorer-repair.mjs';
import goodputCapacityStage from './stages/goodput-capacity.mjs';
import capacitySweepStage from './stages/capacity-sweep.mjs';
import replicaBudgetStage from './stages/replica-budget.mjs';
import percentilePopulationsStage from './stages/percentile-populations.mjs';
import uncertaintyAndQualityStage from './stages/uncertainty-and-quality.mjs';
import confidenceSelectionStage from './stages/confidence-selection.mjs';
import qualityProvenanceStage from './stages/quality-provenance.mjs';
import wrapStage from './stages/wrap.mjs';
import freshReceiptStage from './stages/fresh-receipt.mjs';
export { freshServingState, servingClock } from './construction.mjs';
export { SERVING_COHORT } from './fixtures.mjs';
export {
  arrivalComparison,
  fixedPlayback,
  freshServingRows,
  nearestRank,
  servingGate,
  servingReceipt,
  servingRequestMetrics,
  wilsonLower,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'serving-benchmarks',
  validateModel,
  scenes: [
    introStage,
    workloadFreezeStage,
    arrivalScheduleStage,
    generatorClockStage,
    rateAndConcurrencyStage,
    arrivalFamiliesStage,
    runWindowStage,
    streamTimingStage,
    singleTokenStage,
    chunkBoundariesStage,
    adapterContractStage,
    playbackDeadlinesStage,
    requestDenominatorStage,
    scorerContractStage,
    scorerRepairStage,
    goodputCapacityStage,
    capacitySweepStage,
    replicaBudgetStage,
    percentilePopulationsStage,
    uncertaintyAndQualityStage,
    confidenceSelectionStage,
    qualityProvenanceStage,
    wrapStage,
    freshReceiptStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error('Unknown serving construction ' + scene.id);
}
export default Object.freeze({ ...definition, draw });
