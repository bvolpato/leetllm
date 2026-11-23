import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import receiptContractStage from './stages/receipt-contract.mjs';
import memoryContractStage from './stages/memory-contract.mjs';
import fragmentsStage from './stages/fragments.mjs';
import ownershipStage from './stages/ownership.mjs';
import historyConstructionStage from './stages/history-construction.mjs';
import faultConstructionStage from './stages/fault-construction.mjs';
import containStage from './stages/contain.mjs';
import asyncConstructionStage from './stages/async-construction.mjs';
import containmentContractStage from './stages/containment-contract.mjs';
import diagnosticsStage from './stages/diagnostics.mjs';
import diagnosticPlanStage from './stages/diagnostic-plan.mjs';
import automationContractStage from './stages/automation-contract.mjs';
import analyzerConstructionStage from './stages/analyzer-construction.mjs';
import eventConstructionStage from './stages/event-construction.mjs';
import mixedConstructionStage from './stages/mixed-construction.mjs';
import soakStage from './stages/soak.mjs';
import canaryConstructionStage from './stages/canary-construction.mjs';
import readmitStage from './stages/readmit.mjs';
import earnedGpuTransferStage from './stages/earned-gpu-transfer.mjs';
export { admissionChecks, gpuReceiptFixtures, soakTelemetry } from './fixtures.mjs';
export {
  classifyGpuReceipt,
  containmentTrace,
  covered,
  diagnosticRun,
  freshGpuReceipt,
  gpuFrame,
  gpuIncident,
  historyRing,
  ledger,
  memoryReceipt,
  nodeActions,
  readmission,
} from './arithmetic.mjs';
export { sampleModel, validateGpuConstructions, validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'gpu-failure-operations',
  validateModel,
  scenes: [
    introStage,
    receiptContractStage,
    historyConstructionStage,
    memoryContractStage,
    fragmentsStage,
    ownershipStage,
    analyzerConstructionStage,
    eventConstructionStage,
    faultConstructionStage,
    containStage,
    asyncConstructionStage,
    mixedConstructionStage,
    containmentContractStage,
    automationContractStage,
    diagnosticsStage,
    diagnosticPlanStage,
    soakStage,
    canaryConstructionStage,
    earnedGpuTransferStage,
    readmitStage,
  ],
});
export const draw = definition.draw;
export default definition;
