import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import seed from './stages/seed.mjs';
import generate from './stages/generate.mjs';
import verifierStage from './stages/verifier.mjs';
import overlap from './stages/overlap.mjs';
import diversity from './stages/diversity.mjs';
import judge from './stages/judge.mjs';
import evaluate from './stages/evaluate.mjs';
import taskGrowth from './stages/task-growth.mjs';
import evolution from './stages/evolution.mjs';
import executionBoundaries from './stages/execution-boundaries.mjs';
import admissionEconomics from './stages/admission-economics.mjs';
import safePreferences from './stages/safe-preferences.mjs';
import frameworkPreview from './stages/framework-preview.mjs';
import recursiveTail from './stages/recursive-tail.mjs';
import accumulationWeight from './stages/accumulation-weight.mjs';
import shardIdentity from './stages/shard-identity.mjs';
import downstreamTrial from './stages/downstream-trial.mjs';
import freshAdmission from './stages/fresh-admission.mjs';
export { cosineSimilarity, orderAudit, tailOmission } from './arithmetic.mjs';
export { admissionTrace, diversityState, generationState, judgeSnapshot } from './construction.mjs';
export { CANDIDATES, SEED_METADATA } from './fixtures.mjs';
export { admissionEvidence, runSearchFixture, syntheticRelease, verifier } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'synthetic-data',
  validateModel,
  scenes: [
    intro,
    seed,
    generate,
    taskGrowth,
    evolution,
    verifierStage,
    executionBoundaries,
    overlap,
    diversity,
    judge,
    evaluate,
    admissionEconomics,
    safePreferences,
    frameworkPreview,
    recursiveTail,
    accumulationWeight,
    shardIdentity,
    downstreamTrial,
    freshAdmission,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
