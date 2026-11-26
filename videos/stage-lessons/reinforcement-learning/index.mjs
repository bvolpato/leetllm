// Pure Cinema stage film for `reinforcement-learning` (13 scenes).
import { cinematicLesson } from '../cinematic-kit.mjs';
import { ROLE, verifyRLInvariants } from './parts.mjs';
import bellman from './scenes/bellman.mjs';
import episode from './scenes/episode.mjs';
import exploration from './scenes/exploration.mjs';
import intro from './scenes/intro.mjs';
import llmPolicy from './scenes/llm-policy.mjs';
import mdp from './scenes/mdp.mjs';
import offPolicyEvaluation from './scenes/off-policy-evaluation.mjs';
import policyGradient from './scenes/policy-gradient.mjs';
import qLearning from './scenes/q-learning.mjs';
import rewardDesign from './scenes/reward-design.mjs';
import tdTargets from './scenes/td-targets.mjs';
import uncertainTransition from './scenes/uncertain-transition.mjs';
import valueIteration from './scenes/value-iteration.mjs';

export default cinematicLesson({
  id: 'reinforcement-learning',
  accent: ROLE.state,
  invariants: verifyRLInvariants,
  scenes: {
    intro,
    episode,
    mdp,
    bellman,
    'value-iteration': valueIteration,
    'uncertain-transition': uncertainTransition,
    'q-learning': qLearning,
    'td-targets': tdTargets,
    exploration,
    'policy-gradient': policyGradient,
    'llm-policy': llmPolicy,
    'off-policy-evaluation': offPolicyEvaluation,
    'reward-design': rewardDesign,
  },
});
