import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import residence from './stages/residence.mjs';
import stackContract from './stages/stack-contract.mjs';
import ticketStep from './stages/ticket-step.mjs';
import mapping from './stages/mapping.mjs';
import warps from './stages/warps.mjs';
import coalescing from './stages/coalescing.mjs';
import banks from './stages/banks.mjs';
import storageScope from './stages/storage-scope.mjs';
import barrier from './stages/barrier.mjs';
import clocks from './stages/clocks.mjs';
import budget from './stages/budget.mjs';
import activationBudget from './stages/activation-budget.mjs';
import precisionSlots from './stages/precision-slots.mjs';
import largeModelBudget from './stages/large-model-budget.mjs';
import precisionControls from './stages/precision-controls.mjs';
import allocatorLedger from './stages/allocator-ledger.mjs';
import copyDependencies from './stages/copy-dependencies.mjs';
import synthesis from './stages/synthesis.mjs';
import occupancyResources from './stages/occupancy-resources.mjs';
import profileChoice from './stages/profile-choice.mjs';
import fullStepContract from './stages/full-step-contract.mjs';
import transfer from './stages/transfer.mjs';
import freshRuntime from './stages/fresh-runtime.mjs';
export {
  activationBytes,
  allocatorAccounting,
  cachedBlockRelease,
  executionAt,
  memoryRequests,
  modeledCopySchedule,
  precisionFailureTraces,
  reduction,
  residentResources,
  roofline,
  roundedFormat,
  sharedTrace,
  threadMap,
  tileReuse,
  warmupTrace,
  warpMap,
} from './arithmetic.mjs';
export { extendedValues, freshRuntimeValues, tokenValues } from './fixtures.mjs';
export { sampleModel } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'cuda-execution',
  validateModel,
  scenes: [
    intro,
    residence,
    stackContract,
    ticketStep,
    mapping,
    warps,
    coalescing,
    banks,
    storageScope,
    barrier,
    clocks,
    budget,
    activationBudget,
    precisionSlots,
    largeModelBudget,
    precisionControls,
    allocatorLedger,
    copyDependencies,
    synthesis,
    occupancyResources,
    profileChoice,
    fullStepContract,
    transfer,
    freshRuntime,
  ],
});
export const draw = definition.draw;
export default definition;
