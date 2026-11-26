import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLanguageModelingInvariants } from './shared.mjs';
import {
  context,
  countsScene,
  fullVocabulary,
  intro,
  sparseHistory,
  tokens,
} from './scenes/act1-next-token-counts.mjs';
import {
  conditionalFloor,
  neuralForward,
  neuralGradient,
  objectiveBoundary,
  temperatureFilter,
  vocabularySoftmax,
} from './scenes/act2-neural-softmax-objectives.mjs';
import {
  loss,
  pooledEvaluation,
  sequence,
  shiftContract,
  teacherForcing,
} from './scenes/act3-sequence-training-loss.mjs';
import {
  cacheBudget,
  cacheLifecycle,
  cachedParity,
  generation,
  greedyBranch,
  workAndBandwidth,
} from './scenes/act4-generation-and-kv-cache.mjs';
import {
  architectureMemory,
  contextPolicy,
  evidenceFailure,
  freshBudgetedRollout,
  transfer,
} from './scenes/act5-architecture-policy-transfer.mjs';

export default cinematicLesson({
  id: 'language-modeling',
  accent: COSMOS.gold,
  invariants: verifyLanguageModelingInvariants,
  scenes: {
    intro,
    tokens,
    counts: countsScene,
    'full-vocabulary': fullVocabulary,
    'sparse-history': sparseHistory,
    context,
    'neural-forward': neuralForward,
    'neural-gradient': neuralGradient,
    'conditional-floor': conditionalFloor,
    'vocabulary-softmax': vocabularySoftmax,
    'temperature-filter': temperatureFilter,
    'objective-boundary': objectiveBoundary,
    sequence,
    'teacher-forcing': teacherForcing,
    'shift-contract': shiftContract,
    loss,
    'pooled-evaluation': pooledEvaluation,
    generation,
    'greedy-branch': greedyBranch,
    'cache-lifecycle': cacheLifecycle,
    'cached-parity': cachedParity,
    'work-and-bandwidth': workAndBandwidth,
    'cache-budget': cacheBudget,
    'architecture-memory': architectureMemory,
    'context-policy': contextPolicy,
    'evidence-failure': evidenceFailure,
    transfer,
    'fresh-budgeted-rollout': freshBudgetedRollout,
  },
});
