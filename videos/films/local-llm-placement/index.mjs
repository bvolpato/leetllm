import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import hardwareContract from './stages/hardware-contract.mjs';
import bandwidthBatch from './stages/bandwidth-batch.mjs';
import pools from './stages/pools.mjs';
import weightPayload from './stages/weight-payload.mjs';
import cacheFormula from './stages/cache-formula.mjs';
import workspaceContract from './stages/workspace-contract.mjs';
import retention from './stages/retention.mjs';
import worksheetEvidence from './stages/worksheet-evidence.mjs';
import placement from './stages/placement.mjs';
import flagSemantics from './stages/flag-semantics.mjs';
import allocationEvidence from './stages/allocation-evidence.mjs';
import transfers from './stages/transfers.mjs';
import transferComparison from './stages/transfer-comparison.mjs';
import runnerContract from './stages/runner-contract.mjs';
import servingComparison from './stages/serving-comparison.mjs';
import privateBoundary from './stages/private-boundary.mjs';
import networkControls from './stages/network-controls.mjs';
import inventoryEvidence from './stages/inventory-evidence.mjs';
import timings from './stages/timings.mjs';
import timingContract from './stages/timing-contract.mjs';
import quality from './stages/quality.mjs';
import diagnosticReplay from './stages/diagnostic-replay.mjs';
import synthesis from './stages/synthesis.mjs';
import freshAdmission from './stages/fresh-admission.mjs';
export { outputs } from './fixtures.mjs';
export {
  admission,
  cache,
  evaluate,
  layerFlag,
  memory,
  place,
  rates,
  replayRows,
  sampleModel,
  stream,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'local-llm-placement',
  validateModel,
  scenes: [
    intro,
    weightPayload,
    workspaceContract,
    cacheFormula,
    retention,
    worksheetEvidence,
    synthesis,
    hardwareContract,
    pools,
    bandwidthBatch,
    placement,
    flagSemantics,
    allocationEvidence,
    transfers,
    transferComparison,
    runnerContract,
    servingComparison,
    privateBoundary,
    networkControls,
    inventoryEvidence,
    timings,
    timingContract,
    quality,
    diagnosticReplay,
    freshAdmission,
  ],
});
export const draw = definition.draw;
export default definition;
