import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { rejectUnknownScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import tokenClocksStage from './stages/token-clocks.mjs';
import eventUnitsStage from './stages/event-units.mjs';
import twoLoopsStage from './stages/two-loops.mjs';
import readinessStage from './stages/readiness.mjs';
import probeContractStage from './stages/probe-contract.mjs';
import staticRefillStage from './stages/static-refill.mjs';
import logicalPagesStage from './stages/logical-pages.mjs';
import allocationSlackStage from './stages/allocation-slack.mjs';
import prefixStateStage from './stages/prefix-state.mjs';
import engineContractStage from './stages/engine-contract.mjs';
import requestBenchmarkStage from './stages/request-benchmark.mjs';
import goodputCurveStage from './stages/goodput-curve.mjs';
import workloadStage from './stages/workload.mjs';
import weightStateStage from './stages/weight-state.mjs';
import hybridBudgetStage from './stages/hybrid-budget.mjs';
import residentVActiveStage from './stages/resident-v-active.mjs';
import migSlicesStage from './stages/mig-slices.mjs';
import bandwidthCeilingStage from './stages/bandwidth-ceiling.mjs';
import parallelBytesStage from './stages/parallel-bytes.mjs';
import metricUnitsStage from './stages/metric-units.mjs';
import controllerStage from './stages/controller.mjs';
import controllerBoundariesStage from './stages/controller-boundaries.mjs';
import kedaPhasesStage from './stages/keda-phases.mjs';
import coldpathStage from './stages/coldpath.mjs';
import startupMitigationStage from './stages/startup-mitigation.mjs';
import burstStage from './stages/burst.mjs';
import burstRateStage from './stages/burst-rate.mjs';
import drainStage from './stages/drain.mjs';
import spotDeadlineStage from './stages/spot-deadline.mjs';
import operatingModelStage from './stages/operating-model.mjs';
import failureDiagnosisStage from './stages/failure-diagnosis.mjs';
import splitOwnershipStage from './stages/split-ownership.mjs';
import speculativeContractStage from './stages/speculative-contract.mjs';
import regionalRecoveryStage from './stages/regional-recovery.mjs';
import adapterAuthorityStage from './stages/adapter-authority.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshWavesStage from './stages/fresh-waves.mjs';
export { phases } from './fixtures.mjs';
export {
  autoscaleHybrid,
  autoscaleMemory,
  bandwidthWorksheet,
  burst,
  finiteWarmBurst,
  greedyPrefixExample,
  outcomes,
  pagedAllocation,
  recommend,
  refillSchedule,
  serviceTrial,
  synthesisClock,
  tokenTiming,
} from './arithmetic.mjs';
export { Worker, sampleModel, validateModel, warmPrediction } from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'gpu-autoscaling',
  validateModel,
  scenes: [
    introStage,
    tokenClocksStage,
    eventUnitsStage,
    twoLoopsStage,
    readinessStage,
    probeContractStage,
    staticRefillStage,
    logicalPagesStage,
    allocationSlackStage,
    prefixStateStage,
    engineContractStage,
    requestBenchmarkStage,
    goodputCurveStage,
    workloadStage,
    weightStateStage,
    hybridBudgetStage,
    residentVActiveStage,
    migSlicesStage,
    bandwidthCeilingStage,
    parallelBytesStage,
    metricUnitsStage,
    controllerStage,
    controllerBoundariesStage,
    kedaPhasesStage,
    coldpathStage,
    startupMitigationStage,
    burstStage,
    burstRateStage,
    drainStage,
    spotDeadlineStage,
    operatingModelStage,
    failureDiagnosisStage,
    splitOwnershipStage,
    speculativeContractStage,
    regionalRecoveryStage,
    adapterAuthorityStage,
    synthesisStage,
    freshWavesStage,
  ],
});
const stages = new Map([
  ['intro', introStage],
  ['token-clocks', tokenClocksStage],
  ['event-units', eventUnitsStage],
  ['two-loops', twoLoopsStage],
  ['readiness', readinessStage],
  ['probe-contract', probeContractStage],
  ['static-refill', staticRefillStage],
  ['logical-pages', logicalPagesStage],
  ['allocation-slack', allocationSlackStage],
  ['prefix-state', prefixStateStage],
  ['engine-contract', engineContractStage],
  ['request-benchmark', requestBenchmarkStage],
  ['goodput-curve', goodputCurveStage],
  ['workload', workloadStage],
  ['weight-state', weightStateStage],
  ['hybrid-budget', hybridBudgetStage],
  ['resident-v-active', residentVActiveStage],
  ['mig-slices', migSlicesStage],
  ['bandwidth-ceiling', bandwidthCeilingStage],
  ['parallel-bytes', parallelBytesStage],
  ['metric-units', metricUnitsStage],
  ['controller', controllerStage],
  ['controller-boundaries', controllerBoundariesStage],
  ['keda-phases', kedaPhasesStage],
  ['coldpath', coldpathStage],
  ['startup-mitigation', startupMitigationStage],
  ['burst', burstStage],
  ['burst-rate', burstRateStage],
  ['drain', drainStage],
  ['spot-deadline', spotDeadlineStage],
  ['operating-model', operatingModelStage],
  ['failure-diagnosis', failureDiagnosisStage],
  ['split-ownership', splitOwnershipStage],
  ['speculative-contract', speculativeContractStage],
  ['regional-recovery', regionalRecoveryStage],
  ['adapter-authority', adapterAuthorityStage],
  ['synthesis', synthesisStage],
  ['fresh-waves', freshWavesStage],
]);
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage ? stage.draw(ctx, scene, state, api) : rejectUnknownScene(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;
