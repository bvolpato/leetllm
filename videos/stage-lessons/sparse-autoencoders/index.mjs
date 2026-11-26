// Pure Cinema stage film for `sparse-autoencoders` (14 scenes, cinematicLesson).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifySaeInvariants } from './parts.mjs';
import ablation from './scenes/ablation.mjs';
import clampAndGradient from './scenes/clamp-and-gradient.mjs';
import coverage from './scenes/coverage.mjs';
import dictionary from './scenes/dictionary.mjs';
import featureAudit from './scenes/feature-audit.mjs';
import gatedLearning from './scenes/gated-learning.mjs';
import hookAndCircuit from './scenes/hook-and-circuit.mjs';
import intro from './scenes/intro.mjs';
import objective from './scenes/objective.mjs';
import packingBound from './scenes/packing-bound.mjs';
import selection from './scenes/selection.mjs';
import shrinkage from './scenes/shrinkage.mjs';
import steering from './scenes/steering.mjs';
import trainingEvidence from './scenes/training-evidence.mjs';

export default cinematicLesson({
  id: 'sparse-autoencoders',
  accent: COSMOS.cyan,
  invariants: verifySaeInvariants,
  scenes: {
    intro,
    'packing-bound': packingBound,
    dictionary,
    objective,
    shrinkage,
    selection,
    'gated-learning': gatedLearning,
    ablation,
    steering,
    'clamp-and-gradient': clampAndGradient,
    coverage,
    'hook-and-circuit': hookAndCircuit,
    'training-evidence': trainingEvidence,
    'feature-audit': featureAudit,
  },
});
