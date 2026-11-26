// Cinematic Vizmatic 0.10.0 stage film for Knowledge Distillation for LLMs (18 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyDistillationInvariants } from './parts.mjs';
import alignmentMask from './scenes/alignment-mask.mjs';
import capacity from './scenes/capacity.mjs';
import datasetGates from './scenes/dataset-gates.mjs';
import distribution from './scenes/distribution.mjs';
import featureProjection from './scenes/feature-projection.mjs';
import freshDistillation from './scenes/fresh-distillation.mjs';
import intro from './scenes/intro.mjs';
import learning from './scenes/learning.mjs';
import objective from './scenes/objective.mjs';
import prefixes from './scenes/prefixes.mjs';
import recipeEvidence from './scenes/recipe-evidence.mjs';
import reverseCapacity from './scenes/reverse-capacity.mjs';
import sequenceKl from './scenes/sequence-kl.mjs';
import sequences from './scenes/sequences.mjs';
import signalAndTrainer from './scenes/signal-and-trainer.mjs';
import temperature from './scenes/temperature.mjs';
import temperatureGradient from './scenes/temperature-gradient.mjs';
import transfer from './scenes/transfer.mjs';

export default cinematicLesson({
  id: 'distillation',
  accent: COSMOS.cyan,
  invariants: verifyDistillationInvariants,
  scenes: {
    intro,
    distribution,
    temperature,
    objective,
    learning,
    'temperature-gradient': temperatureGradient,
    'alignment-mask': alignmentMask,
    'feature-projection': featureProjection,
    sequences,
    prefixes,
    'reverse-capacity': reverseCapacity,
    'sequence-kl': sequenceKl,
    'signal-and-trainer': signalAndTrainer,
    'dataset-gates': datasetGates,
    'recipe-evidence': recipeEvidence,
    transfer,
    capacity,
    'fresh-distillation': freshDistillation,
  },
});
