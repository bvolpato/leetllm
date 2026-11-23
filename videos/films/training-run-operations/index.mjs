import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import firstRead from './stages/first-read.mjs';
import moments from './stages/moments.mjs';
import adamFirstStep from './stages/adam-first-step.mjs';
import checkpointOwnership from './stages/checkpoint-ownership.mjs';
import durable from './stages/durable.mjs';
import cursorAndWindow from './stages/cursor-and-window.mjs';
import deadline from './stages/deadline.mjs';
import intervalAndReliability from './stages/interval-and-reliability.mjs';
import reshard from './stages/reshard.mjs';
import storageTopologyContract from './stages/storage-topology-contract.mjs';
import replicas from './stages/replicas.mjs';
import batchAndSchedule from './stages/batch-and-schedule.mjs';
import tokens from './stages/tokens.mjs';
import overflow from './stages/overflow.mjs';
import diagnosisAndRollback from './stages/diagnosis-and-rollback.mjs';
import adaptationAndMemory from './stages/adaptation-and-memory.mjs';
import freshRestore from './stages/fresh-restore.mjs';
export {
  adamScaleProposal,
  consumedCursorPlan,
  firstAdaptiveMovement,
  trainingMemory,
} from './arithmetic.mjs';
export {
  checkpointRestore,
  durableSaveState,
  reshardConstruction,
  tokenReduction,
  trainingFreshState,
  warningSeconds,
} from './construction.mjs';
export { DEADLINE_WARNING_CUE, advance } from './fixtures.mjs';
export {
  sampleModel,
  validateConstructions,
  validateModel,
  validateTrainingExpansion,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'training-run-operations',
  validateModel,
  scenes: [
    firstRead,
    intro,
    replicas,
    cursorAndWindow,
    checkpointOwnership,
    durable,
    deadline,
    intervalAndReliability,
    moments,
    adamFirstStep,
    reshard,
    storageTopologyContract,
    batchAndSchedule,
    tokens,
    overflow,
    diagnosisAndRollback,
    adaptationAndMemory,
    freshRestore,
  ],
});
export const draw = definition.draw;
export default definition;
