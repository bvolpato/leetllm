// Cinematic Vizmatic 0.10.0 stage film for Build, Verify and Evaluate Synthetic Training Data (19 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifySyntheticDataInvariants } from './parts.mjs';
import accumulationWeight from './scenes/accumulation-weight.mjs';
import admissionEconomics from './scenes/admission-economics.mjs';
import diversity from './scenes/diversity.mjs';
import downstreamTrial from './scenes/downstream-trial.mjs';
import evaluate from './scenes/evaluate.mjs';
import evolution from './scenes/evolution.mjs';
import executionBoundaries from './scenes/execution-boundaries.mjs';
import frameworkPreview from './scenes/framework-preview.mjs';
import freshAdmission from './scenes/fresh-admission.mjs';
import generate from './scenes/generate.mjs';
import intro from './scenes/intro.mjs';
import judge from './scenes/judge.mjs';
import overlap from './scenes/overlap.mjs';
import recursiveTail from './scenes/recursive-tail.mjs';
import safePreferences from './scenes/safe-preferences.mjs';
import seed from './scenes/seed.mjs';
import shardIdentity from './scenes/shard-identity.mjs';
import taskGrowth from './scenes/task-growth.mjs';
import verifierScene from './scenes/verifier.mjs';

export default cinematicLesson({
  id: 'synthetic-data',
  accent: COSMOS.cyan,
  invariants: verifySyntheticDataInvariants,
  scenes: {
    intro,
    seed,
    generate,
    'task-growth': taskGrowth,
    evolution,
    verifier: verifierScene,
    'execution-boundaries': executionBoundaries,
    overlap,
    diversity,
    judge,
    evaluate,
    'admission-economics': admissionEconomics,
    'safe-preferences': safePreferences,
    'framework-preview': frameworkPreview,
    'recursive-tail': recursiveTail,
    'accumulation-weight': accumulationWeight,
    'shard-identity': shardIdentity,
    'downstream-trial': downstreamTrial,
    'fresh-admission': freshAdmission,
  },
});
