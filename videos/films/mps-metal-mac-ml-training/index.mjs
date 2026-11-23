import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { draw } from './compatibility.mjs';
export { draw } from './compatibility.mjs';
import openingStage from './stages/opening.mjs';
import backendStage from './stages/backend.mjs';
import releasePrerequisitesStage from './stages/release-prerequisites.mjs';
import sharedPoolStage from './stages/shared-pool.mjs';
import assignmentStage from './stages/assignment.mjs';
import deviceIdentityStage from './stages/device-identity.mjs';
import poolingStage from './stages/pooling.mjs';
import scoreStage from './stages/score.mjs';
import probabilitiesStage from './stages/probabilities.mjs';
import batchUpdateStage from './stages/batch-update.mjs';
import shapeAndStepStage from './stages/shape-and-step.mjs';
import fallbackStage from './stages/fallback.mjs';
import fallbackAccountingStage from './stages/fallback-accounting.mjs';
import dtypeAllocationStage from './stages/dtype-allocation.mjs';
import precisionStage from './stages/precision.mjs';
import autocastStage from './stages/autocast.mjs';
import timingStage from './stages/timing.mjs';
import measurementReceiptStage from './stages/measurement-receipt.mjs';
import profilingStage from './stages/profiling.mjs';
import crossoverStage from './stages/crossover.mjs';
import memoryBudgetStage from './stages/memory-budget.mjs';
import allocatorStage from './stages/allocator.mjs';
import allocatorLimitsStage from './stages/allocator-limits.mjs';
import returnTicketStage from './stages/return-ticket.mjs';
import freshTicketStage from './stages/fresh-ticket.mjs';
export { classNames, sceneBeatCounts, ticketTexts } from './fixtures.mjs';
export {
  allocatorCase,
  backendChoice,
  classifierFixture,
  classifierShapes,
  classifierTrainingFixture,
  crossoverCost,
  featureBytes,
  float32Neighbors,
  freshMpsFixture,
  mpsExtensionModel,
  mpsWatermarkExample,
  precisionDecision,
  profilingTrace,
  serialMpsSchedule,
  tensorShapeContract,
} from './arithmetic.mjs';
export { sampleModel, trainingLossAtUpdate, validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'mps-metal-mac-ml-training',
  validateModel,
  scenes: [
    openingStage,
    backendStage,
    releasePrerequisitesStage,
    sharedPoolStage,
    assignmentStage,
    deviceIdentityStage,
    poolingStage,
    scoreStage,
    probabilitiesStage,
    batchUpdateStage,
    shapeAndStepStage,
    fallbackStage,
    fallbackAccountingStage,
    dtypeAllocationStage,
    precisionStage,
    autocastStage,
    timingStage,
    measurementReceiptStage,
    profilingStage,
    crossoverStage,
    memoryBudgetStage,
    allocatorStage,
    allocatorLimitsStage,
    returnTicketStage,
    freshTicketStage,
  ],
});
export default Object.freeze({
  ...definition,
  draw,
});
