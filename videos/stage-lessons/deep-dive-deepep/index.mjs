// Cinematic Vizmatic 0.10.0 stage film for DeepEP (32 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyDeepEpInvariants } from './parts.mjs';
import backendOwnership from './scenes/backend-ownership.mjs';
import backwardOperators from './scenes/backward-operators.mjs';
import balancedAssumptions from './scenes/balanced-assumptions.mjs';
import bufferCapacity from './scenes/buffer-capacity.mjs';
import combine from './scenes/combine.mjs';
import deferredContract from './scenes/deferred-contract.mjs';
import deterministicOrder from './scenes/deterministic-order.mjs';
import dispatch from './scenes/dispatch.mjs';
import earnedReturn from './scenes/earned-return.mjs';
import engramDoorbell from './scenes/engram-doorbell.mjs';
import events from './scenes/events.mjs';
import handleLifetime from './scenes/handle-lifetime.mjs';
import historicalBenchmark from './scenes/historical-benchmark.mjs';
import intro from './scenes/intro.mjs';
import jitColdStart from './scenes/jit-cold-start.mjs';
import layoutBoundaries from './scenes/layout-boundaries.mjs';
import layout from './scenes/layout.mjs';
import legacyExperimental from './scenes/legacy-experimental.mjs';
import logicalReceipts from './scenes/logical-receipts.mjs';
import ownershipLicense from './scenes/ownership-license.mjs';
import postTrainingReceipt from './scenes/post-training-receipt.mjs';
import precision from './scenes/precision.mjs';
import redundantExperts from './scenes/redundant-experts.mjs';
import resourceBudget from './scenes/resource-budget.mjs';
import resources from './scenes/resources.mjs';
import rounding from './scenes/rounding.mjs';
import runtimeIdentity from './scenes/runtime-identity.mjs';
import scaleContract from './scenes/scale-contract.mjs';
import sourceDiagnosis from './scenes/source-diagnosis.mjs';
import topology from './scenes/topology.mjs';
import versionBoundary from './scenes/version-boundary.mjs';
import visibilityFence from './scenes/visibility-fence.mjs';

export default cinematicLesson({
  id: 'deep-dive-deepep',
  accent: COSMOS.amber,
  invariants: verifyDeepEpInvariants,
  scenes: {
    intro,
    'version-boundary': versionBoundary,
    dispatch,
    layout,
    'layout-boundaries': layoutBoundaries,
    'handle-lifetime': handleLifetime,
    combine,
    'backward-operators': backwardOperators,
    rounding,
    'deterministic-order': deterministicOrder,
    topology,
    'visibility-fence': visibilityFence,
    'backend-ownership': backendOwnership,
    'logical-receipts': logicalReceipts,
    'historical-benchmark': historicalBenchmark,
    precision,
    'scale-contract': scaleContract,
    events,
    'buffer-capacity': bufferCapacity,
    'deferred-contract': deferredContract,
    'redundant-experts': redundantExperts,
    resources,
    'balanced-assumptions': balancedAssumptions,
    'resource-budget': resourceBudget,
    'jit-cold-start': jitColdStart,
    'runtime-identity': runtimeIdentity,
    'legacy-experimental': legacyExperimental,
    'engram-doorbell': engramDoorbell,
    'post-training-receipt': postTrainingReceipt,
    'ownership-license': ownershipLicense,
    'source-diagnosis': sourceDiagnosis,
    'earned-return': earnedReturn,
  },
});
