// The lesson `sparse-autoencoders` as a narrated film. One file for each scene, in the order of lesson.yaml.
import { narratedLesson } from '../../lib/narrated-lesson.mjs';
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

export default narratedLesson({
  id: 'sparse-autoencoders',
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
