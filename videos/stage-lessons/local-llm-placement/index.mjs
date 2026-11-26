// Full-bleed dark-cinema 25-scene Local LLM Placement & Hardware Budgets stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLocalPlacementInvariants } from './parts.mjs';
import allocationEvidence from './scenes/allocation-evidence.mjs';
import bandwidthBatch from './scenes/bandwidth-batch.mjs';
import cacheFormula from './scenes/cache-formula.mjs';
import diagnosticReplay from './scenes/diagnostic-replay.mjs';
import flagSemantics from './scenes/flag-semantics.mjs';
import freshAdmission from './scenes/fresh-admission.mjs';
import hardwareContract from './scenes/hardware-contract.mjs';
import intro from './scenes/intro.mjs';
import inventoryEvidence from './scenes/inventory-evidence.mjs';
import networkControls from './scenes/network-controls.mjs';
import placement from './scenes/placement.mjs';
import pools from './scenes/pools.mjs';
import privateBoundary from './scenes/private-boundary.mjs';
import quality from './scenes/quality.mjs';
import retention from './scenes/retention.mjs';
import runnerContract from './scenes/runner-contract.mjs';
import servingComparison from './scenes/serving-comparison.mjs';
import synthesis from './scenes/synthesis.mjs';
import timingContract from './scenes/timing-contract.mjs';
import timings from './scenes/timings.mjs';
import transferComparison from './scenes/transfer-comparison.mjs';
import transfers from './scenes/transfers.mjs';
import weightPayload from './scenes/weight-payload.mjs';
import worksheetEvidence from './scenes/worksheet-evidence.mjs';
import workspaceContract from './scenes/workspace-contract.mjs';

export default cinematicLesson({
  id: 'local-llm-placement',
  accent: COSMOS.cyan,
  invariants: verifyLocalPlacementInvariants,
  scenes: {
    intro,
    'weight-payload': weightPayload,
    'workspace-contract': workspaceContract,
    'cache-formula': cacheFormula,
    retention,
    'worksheet-evidence': worksheetEvidence,
    synthesis,
    'hardware-contract': hardwareContract,
    pools,
    'bandwidth-batch': bandwidthBatch,
    placement,
    'flag-semantics': flagSemantics,
    'allocation-evidence': allocationEvidence,
    transfers,
    'transfer-comparison': transferComparison,
    'runner-contract': runnerContract,
    'serving-comparison': servingComparison,
    'private-boundary': privateBoundary,
    'network-controls': networkControls,
    'inventory-evidence': inventoryEvidence,
    timings,
    'timing-contract': timingContract,
    quality,
    'diagnostic-replay': diagnosticReplay,
    'fresh-admission': freshAdmission,
  },
});
