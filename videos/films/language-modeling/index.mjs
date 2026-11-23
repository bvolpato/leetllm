import { EXTENDED_SCENES } from './fixtures.mjs';
import { rejectUnknownExtension } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import tokens from './stages/tokens.mjs';
import countsStage from './stages/counts.mjs';
import fullVocabulary from './stages/full-vocabulary.mjs';
import sparseHistory from './stages/sparse-history.mjs';
import context from './stages/context.mjs';
import neuralForward from './stages/neural-forward.mjs';
import neuralGradient from './stages/neural-gradient.mjs';
import conditionalFloor from './stages/conditional-floor.mjs';
import vocabularySoftmax from './stages/vocabulary-softmax.mjs';
import temperatureFilter from './stages/temperature-filter.mjs';
import objectiveBoundary from './stages/objective-boundary.mjs';
import sequence from './stages/sequence.mjs';
import teacherForcing from './stages/teacher-forcing.mjs';
import shiftContract from './stages/shift-contract.mjs';
import loss from './stages/loss.mjs';
import pooledEvaluation from './stages/pooled-evaluation.mjs';
import generation from './stages/generation.mjs';
import greedyBranch from './stages/greedy-branch.mjs';
import cacheLifecycle from './stages/cache-lifecycle.mjs';
import cachedParity from './stages/cached-parity.mjs';
import workAndBandwidth from './stages/work-and-bandwidth.mjs';
import cacheBudget from './stages/cache-budget.mjs';
import architectureMemory from './stages/architecture-memory.mjs';
import contextPolicy from './stages/context-policy.mjs';
import evidenceFailure from './stages/evidence-failure.mjs';
import transfer from './stages/transfer.mjs';
import freshBudgetedRollout from './stages/fresh-budgeted-rollout.mjs';
export {
  CACHE_PARITY_FIXTURE,
  CONDITIONAL_ROWS,
  CORPUS,
  EXTENDED_SCENES,
  FITTED_NGRAM,
  SENTENCE,
  TARGET_PROBS,
  VERBS,
} from './fixtures.mjs';
export {
  LOSS,
  architectureMemoryState,
  conditionalDistribution,
  contextState,
  countState,
  counts,
  extendedLanguageState,
  fittedPrediction,
  generationState,
  generationWork,
  lifecycleSnapshot,
  localGradientCredit,
  lossConstructionState,
  rawKvBytes,
  selectSample,
  sequenceState,
  teacherForcingState,
  transferState,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'language-modeling',
  validateModel,
  scenes: [
    intro,
    tokens,
    countsStage,
    fullVocabulary,
    sparseHistory,
    context,
    neuralForward,
    neuralGradient,
    conditionalFloor,
    vocabularySoftmax,
    temperatureFilter,
    objectiveBoundary,
    sequence,
    teacherForcing,
    shiftContract,
    loss,
    pooledEvaluation,
    generation,
    greedyBranch,
    cacheLifecycle,
    cachedParity,
    workAndBandwidth,
    cacheBudget,
    architectureMemory,
    contextPolicy,
    evidenceFailure,
    transfer,
    freshBudgetedRollout,
  ],
});

const originalStages = new Map([
  ['intro', intro],
  ['tokens', tokens],
  ['counts', countsStage],
  ['context', context],
  ['sequence', sequence],
  ['teacher-forcing', teacherForcing],
  ['loss', loss],
  ['generation', generation],
  ['transfer', transfer],
]);
const extendedStages = new Map([
  ['full-vocabulary', fullVocabulary],
  ['sparse-history', sparseHistory],
  ['neural-forward', neuralForward],
  ['neural-gradient', neuralGradient],
  ['conditional-floor', conditionalFloor],
  ['vocabulary-softmax', vocabularySoftmax],
  ['temperature-filter', temperatureFilter],
  ['objective-boundary', objectiveBoundary],
  ['shift-contract', shiftContract],
  ['pooled-evaluation', pooledEvaluation],
  ['greedy-branch', greedyBranch],
  ['cache-lifecycle', cacheLifecycle],
  ['cached-parity', cachedParity],
  ['work-and-bandwidth', workAndBandwidth],
  ['cache-budget', cacheBudget],
  ['architecture-memory', architectureMemory],
  ['context-policy', contextPolicy],
  ['evidence-failure', evidenceFailure],
  ['fresh-budgeted-rollout', freshBudgetedRollout],
]);
export function draw(ctx, scene, state, api) {
  if (EXTENDED_SCENES.has(scene.id)) {
    const stage = extendedStages.get(scene.id);
    return stage
      ? stage.draw(ctx, scene, state, api)
      : rejectUnknownExtension(ctx, scene, state, api);
  }
  const stage = originalStages.get(scene.id);
  if (stage) return stage.draw(ctx, scene, state, api);
  throw new Error('Unknown language-modeling scene ' + scene.id);
}
export default Object.freeze({ ...definition, draw });
