// Cinematic Vizmatic stage lesson for GPU Serving & Autoscaling (all 38 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyGpuAutoscalingInvariants } from './parts.mjs';
import adapterAuthority from './scenes/adapter-authority.mjs';
import allocationSlack from './scenes/allocation-slack.mjs';
import bandwidthCeiling from './scenes/bandwidth-ceiling.mjs';
import burst from './scenes/burst.mjs';
import burstRate from './scenes/burst-rate.mjs';
import coldpath from './scenes/coldpath.mjs';
import controller from './scenes/controller.mjs';
import controllerBoundaries from './scenes/controller-boundaries.mjs';
import drain from './scenes/drain.mjs';
import engineContract from './scenes/engine-contract.mjs';
import eventUnits from './scenes/event-units.mjs';
import failureDiagnosis from './scenes/failure-diagnosis.mjs';
import freshWaves from './scenes/fresh-waves.mjs';
import goodputCurve from './scenes/goodput-curve.mjs';
import hybridBudget from './scenes/hybrid-budget.mjs';
import intro from './scenes/intro.mjs';
import kedaPhases from './scenes/keda-phases.mjs';
import logicalPages from './scenes/logical-pages.mjs';
import metricUnits from './scenes/metric-units.mjs';
import migSlices from './scenes/mig-slices.mjs';
import operatingModel from './scenes/operating-model.mjs';
import parallelBytes from './scenes/parallel-bytes.mjs';
import prefixState from './scenes/prefix-state.mjs';
import probeContract from './scenes/probe-contract.mjs';
import readiness from './scenes/readiness.mjs';
import regionalRecovery from './scenes/regional-recovery.mjs';
import requestBenchmark from './scenes/request-benchmark.mjs';
import residentVActive from './scenes/resident-v-active.mjs';
import speculativeContract from './scenes/speculative-contract.mjs';
import splitOwnership from './scenes/split-ownership.mjs';
import spotDeadline from './scenes/spot-deadline.mjs';
import startupMitigation from './scenes/startup-mitigation.mjs';
import staticRefill from './scenes/static-refill.mjs';
import synthesis from './scenes/synthesis.mjs';
import tokenClocks from './scenes/token-clocks.mjs';
import twoLoops from './scenes/two-loops.mjs';
import weightState from './scenes/weight-state.mjs';
import workload from './scenes/workload.mjs';

export default cinematicLesson({
  id: 'gpu-autoscaling',
  accent: COSMOS.cyan,
  invariants: verifyGpuAutoscalingInvariants,
  scenes: {
    intro,
    'token-clocks': tokenClocks,
    'event-units': eventUnits,
    'two-loops': twoLoops,
    readiness,
    'probe-contract': probeContract,
    'static-refill': staticRefill,
    'logical-pages': logicalPages,
    'allocation-slack': allocationSlack,
    'prefix-state': prefixState,
    'engine-contract': engineContract,
    'request-benchmark': requestBenchmark,
    'goodput-curve': goodputCurve,
    workload,
    'weight-state': weightState,
    'hybrid-budget': hybridBudget,
    'resident-v-active': residentVActive,
    'mig-slices': migSlices,
    'bandwidth-ceiling': bandwidthCeiling,
    'parallel-bytes': parallelBytes,
    'metric-units': metricUnits,
    controller,
    'controller-boundaries': controllerBoundaries,
    'keda-phases': kedaPhases,
    coldpath,
    'startup-mitigation': startupMitigation,
    burst,
    'burst-rate': burstRate,
    drain,
    'spot-deadline': spotDeadline,
    'operating-model': operatingModel,
    'failure-diagnosis': failureDiagnosis,
    'split-ownership': splitOwnership,
    'speculative-contract': speculativeContract,
    'regional-recovery': regionalRecovery,
    'adapter-authority': adapterAuthority,
    synthesis,
    'fresh-waves': freshWaves,
  },
});
