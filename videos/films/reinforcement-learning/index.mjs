import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import episodeStage from './stages/episode.mjs';
import mdpStage from './stages/mdp.mjs';
import bellmanStage from './stages/bellman.mjs';
import valueIterationStage from './stages/value-iteration.mjs';
import uncertainTransitionStage from './stages/uncertain-transition.mjs';
import qLearningStage from './stages/q-learning.mjs';
import tdTargetsStage from './stages/td-targets.mjs';
import explorationStage from './stages/exploration.mjs';
import policyGradientStage from './stages/policy-gradient.mjs';
import llmPolicyStage from './stages/llm-policy.mjs';
import offPolicyEvaluationStage from './stages/off-policy-evaluation.mjs';
import rewardDesignStage from './stages/reward-design.mjs';
export {
  epsilonDecision,
  evidenceValue,
  indifferenceProbability,
  openingActions,
  reviewValue,
} from './arithmetic.mjs';
export {
  abandonmentProbability,
  explorationActions,
  explorationDraws,
  explorationEpsilon,
  explorationQ,
  gamma,
  openingBaseline,
  openingGradient,
  openingPolicyValues,
  returns,
  transitionSweepCrossoverProgress,
  updatedPolicy,
} from './fixtures.mjs';
export {
  explorationEpisodes,
  explorationLedger,
  learningSnapshot,
  mdpSnapshot,
  observeEnvironment,
  transitionSnapshot,
  validateModel,
  valueIteration,
  valueIterationSnapshot,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'reinforcement-learning',
  validateModel,
  scenes: [
    introStage,
    episodeStage,
    mdpStage,
    bellmanStage,
    valueIterationStage,
    uncertainTransitionStage,
    qLearningStage,
    tdTargetsStage,
    explorationStage,
    policyGradientStage,
    llmPolicyStage,
    offPolicyEvaluationStage,
    rewardDesignStage,
  ],
});
export const draw = definition.draw;
export default definition;
