// Account for Every Optimizer Update: 23-scene Cinematic Stage Lesson
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyOptimizersInvariants } from './shared.mjs';
import {
  firstStep,
  intro,
  momentum,
  momentumConventions,
  stability,
} from './scenes/act1-valley-sgd.mjs';
import {
  adamBuffers,
  adamHistory,
  adamStep,
  objectiveScale,
  rmsprop,
} from './scenes/act2-adaptive-adam.mjs';
import {
  accumulation,
  clipping,
  comparison,
  schedule,
} from './scenes/act3-race-schedule-batch.mjs';
import {
  checkpointHistory,
  decay,
  optimizerMemory,
  torchLoop,
  zeroDataDecay,
} from './scenes/act4-decay-torch-memory.mjs';
import {
  diagnosticTrace,
  evidenceBudget,
  freshRecipe,
  transfer,
} from './scenes/act5-evidence-diagnosis-finale.mjs';

export default cinematicLesson({
  id: 'optimizers',
  accent: COSMOS.cyan,
  invariants: verifyOptimizersInvariants,
  scenes: {
    intro,
    'first-step': firstStep,
    stability,
    momentum,
    'momentum-conventions': momentumConventions,
    rmsprop,
    'adam-buffers': adamBuffers,
    'adam-step': adamStep,
    'adam-history': adamHistory,
    'objective-scale': objectiveScale,
    comparison,
    schedule,
    accumulation,
    clipping,
    decay,
    'zero-data-decay': zeroDataDecay,
    'torch-loop': torchLoop,
    'checkpoint-history': checkpointHistory,
    'optimizer-memory': optimizerMemory,
    'evidence-budget': evidenceBudget,
    'diagnostic-trace': diagnosticTrace,
    transfer,
    'fresh-recipe': freshRecipe,
  },
});
