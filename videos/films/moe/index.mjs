import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import capacityQuestion from './stages/capacity-question.mjs';
import sharedAndRouted from './stages/shared-and-routed.mjs';
import routerScores from './stages/router-scores.mjs';
import topTwo from './stages/top-two.mjs';
import weightedOutput from './stages/weighted-output.mjs';
import routingRules from './stages/routing-rules.mjs';
import routerContract from './stages/router-contract.mjs';
import gateGradient from './stages/gate-gradient.mjs';
import batchDispatch from './stages/batch-dispatch.mjs';
import packPermutation from './stages/pack-permutation.mjs';
import scatterCombine from './stages/scatter-combine.mjs';
import expertChoice from './stages/expert-choice.mjs';
import prefixConsistency from './stages/prefix-consistency.mjs';
import trainingSkew from './stages/training-skew.mjs';
import balancePressure from './stages/balance-pressure.mjs';
import balanceValue from './stages/balance-value.mjs';
import balanceCounterexample from './stages/balance-counterexample.mjs';
import zPartition from './stages/z-partition.mjs';
import capacityLimit from './stages/capacity-limit.mjs';
import capacityArithmetic from './stages/capacity-arithmetic.mjs';
import droplessWork from './stages/dropless-work.mjs';
import parameterMemory from './stages/parameter-memory.mjs';
import residencyBudget from './stages/residency-budget.mjs';
import expertArithmetic from './stages/expert-arithmetic.mjs';
import familyArchitecture from './stages/family-architecture.mjs';
import selectionBias from './stages/selection-bias.mjs';
import checkpointContract from './stages/checkpoint-contract.mjs';
import hybridMixer from './stages/hybrid-mixer.mjs';
import expertParallelism from './stages/expert-parallelism.mjs';
import wireProtocol from './stages/wire-protocol.mjs';
import parallelLayout from './stages/parallel-layout.mjs';
import prefetchDependency from './stages/prefetch-dependency.mjs';
import evaluatePath from './stages/evaluate-path.mjs';
import servingGate from './stages/serving-gate.mjs';
import diagnoseRouting from './stages/diagnose-routing.mjs';
import freshRoute from './stages/fresh-route.mjs';
export { route } from './arithmetic.mjs';
export {
  moeCue,
  overflowReroute,
  routerScoreSnapshot,
  trainingSkewSnapshot,
} from './construction.mjs';
export {
  BATCH_ROUTES,
  BLENDED_OUTPUT,
  CAPACITY_ROUTES,
  EXPERT_OUTPUTS,
  MOE_ASSIGNMENTS,
  MOE_FRESH_ROUTES,
  MOE_INPUTS,
  REMOTE_ASSIGNMENTS,
  ROUTER_LOGITS,
  ROUTING,
  SKEW_COUNTS,
} from './fixtures.mjs';
export {
  moeBalance,
  moeCapacity,
  moeChoice,
  moeFresh,
  moePacked,
  moeReplica,
  moeScalarGate,
  moeSelection,
  moeServing,
  moeValidatedRoute,
  moeWire,
  moeZ,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'moe',
  validateModel,
  scenes: [
    capacityQuestion,
    sharedAndRouted,
    routerScores,
    topTwo,
    weightedOutput,
    routingRules,
    routerContract,
    gateGradient,
    batchDispatch,
    packPermutation,
    scatterCombine,
    expertChoice,
    prefixConsistency,
    trainingSkew,
    balancePressure,
    balanceValue,
    balanceCounterexample,
    zPartition,
    capacityLimit,
    droplessWork,
    capacityArithmetic,
    parameterMemory,
    residencyBudget,
    expertArithmetic,
    familyArchitecture,
    selectionBias,
    checkpointContract,
    hybridMixer,
    expertParallelism,
    wireProtocol,
    parallelLayout,
    prefetchDependency,
    evaluatePath,
    servingGate,
    diagnoseRouting,
    freshRoute,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((stage) => stage.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
