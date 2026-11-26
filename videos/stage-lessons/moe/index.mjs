// Full-bleed dark-cinema 36-scene Mixture of Experts stage lesson.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyMoeInvariants } from './parts.mjs';
import {
  capacityQuestion,
  routerScores,
  routingRules,
  sharedAndRouted,
  topTwo,
  weightedOutput,
} from './scenes/act1-routing.mjs';
import {
  batchDispatch,
  expertChoice,
  gateGradient,
  packPermutation,
  routerContract,
  scatterCombine,
} from './scenes/act2-dispatch.mjs';
import {
  balanceCounterexample,
  balancePressure,
  balanceValue,
  prefixConsistency,
  trainingSkew,
  zPartition,
} from './scenes/act3-balance.mjs';
import {
  capacityArithmetic,
  capacityLimit,
  droplessWork,
  expertArithmetic,
  parameterMemory,
  residencyBudget,
} from './scenes/act4-capacity.mjs';
import {
  checkpointContract,
  expertParallelism,
  familyArchitecture,
  hybridMixer,
  selectionBias,
  wireProtocol,
} from './scenes/act5-architectures.mjs';
import {
  diagnoseRouting,
  evaluatePath,
  freshRoute,
  parallelLayout,
  prefetchDependency,
  servingGate,
} from './scenes/act6-serving.mjs';

export default cinematicLesson({
  id: 'moe',
  accent: COSMOS.cyan,
  invariants: verifyMoeInvariants,
  scenes: {
    'capacity-question': capacityQuestion,
    'shared-and-routed': sharedAndRouted,
    'router-scores': routerScores,
    'top-two': topTwo,
    'weighted-output': weightedOutput,
    'routing-rules': routingRules,
    'router-contract': routerContract,
    'gate-gradient': gateGradient,
    'batch-dispatch': batchDispatch,
    'pack-permutation': packPermutation,
    'scatter-combine': scatterCombine,
    'expert-choice': expertChoice,
    'prefix-consistency': prefixConsistency,
    'training-skew': trainingSkew,
    'balance-pressure': balancePressure,
    'balance-value': balanceValue,
    'balance-counterexample': balanceCounterexample,
    'z-partition': zPartition,
    'capacity-limit': capacityLimit,
    'dropless-work': droplessWork,
    'capacity-arithmetic': capacityArithmetic,
    'parameter-memory': parameterMemory,
    'residency-budget': residencyBudget,
    'expert-arithmetic': expertArithmetic,
    'family-architecture': familyArchitecture,
    'selection-bias': selectionBias,
    'checkpoint-contract': checkpointContract,
    'hybrid-mixer': hybridMixer,
    'expert-parallelism': expertParallelism,
    'wire-protocol': wireProtocol,
    'parallel-layout': parallelLayout,
    'prefetch-dependency': prefetchDependency,
    'evaluate-path': evaluatePath,
    'serving-gate': servingGate,
    'diagnose-routing': diagnoseRouting,
    'fresh-route': freshRoute,
  },
});
