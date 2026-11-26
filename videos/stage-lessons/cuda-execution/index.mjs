// Cinematic Vizmatic 0.10.0 stage film for CUDA Execution (24 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyCudaInvariants } from './parts.mjs';
import activationBudget from './scenes/activation-budget.mjs';
import allocatorLedger from './scenes/allocator-ledger.mjs';
import banks from './scenes/banks.mjs';
import barrier from './scenes/barrier.mjs';
import budget from './scenes/budget.mjs';
import clocks from './scenes/clocks.mjs';
import coalescing from './scenes/coalescing.mjs';
import copyDependencies from './scenes/copy-dependencies.mjs';
import freshRuntime from './scenes/fresh-runtime.mjs';
import fullStepContract from './scenes/full-step-contract.mjs';
import intro from './scenes/intro.mjs';
import largeModelBudget from './scenes/large-model-budget.mjs';
import mapping from './scenes/mapping.mjs';
import occupancyResources from './scenes/occupancy-resources.mjs';
import precisionControls from './scenes/precision-controls.mjs';
import precisionSlots from './scenes/precision-slots.mjs';
import profileChoice from './scenes/profile-choice.mjs';
import residence from './scenes/residence.mjs';
import stackContract from './scenes/stack-contract.mjs';
import storageScope from './scenes/storage-scope.mjs';
import synthesis from './scenes/synthesis.mjs';
import ticketStep from './scenes/ticket-step.mjs';
import transfer from './scenes/transfer.mjs';
import warps from './scenes/warps.mjs';

export default cinematicLesson({
  id: 'cuda-execution',
  accent: COSMOS.cyan,
  invariants: verifyCudaInvariants,
  scenes: {
    intro,
    residence,
    'stack-contract': stackContract,
    'ticket-step': ticketStep,
    mapping,
    warps,
    coalescing,
    banks,
    'storage-scope': storageScope,
    barrier,
    clocks,
    budget,
    'activation-budget': activationBudget,
    'precision-slots': precisionSlots,
    'large-model-budget': largeModelBudget,
    'precision-controls': precisionControls,
    'allocator-ledger': allocatorLedger,
    'copy-dependencies': copyDependencies,
    synthesis,
    'occupancy-resources': occupancyResources,
    'profile-choice': profileChoice,
    'full-step-contract': fullStepContract,
    transfer,
    'fresh-runtime': freshRuntime,
  },
});
