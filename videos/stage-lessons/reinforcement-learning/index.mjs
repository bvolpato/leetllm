import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import scene0 from './scenes/intro.mjs';
import scene1 from './scenes/episode.mjs';
import scene2 from './scenes/mdp.mjs';
import scene3 from './scenes/bellman.mjs';
import scene4 from './scenes/value-iteration.mjs';
import scene5 from './scenes/uncertain-transition.mjs';
import scene6 from './scenes/q-learning.mjs';
import scene7 from './scenes/td-targets.mjs';
import scene8 from './scenes/exploration.mjs';
import scene9 from './scenes/policy-gradient.mjs';
import scene10 from './scenes/llm-policy.mjs';
import scene11 from './scenes/off-policy-evaluation.mjs';
import scene12 from './scenes/reward-design.mjs';
export default narratedLesson({
  id: 'reinforcement-learning',
  scenes: {
    'intro': scene0,
    'episode': scene1,
    'mdp': scene2,
    'bellman': scene3,
    'value-iteration': scene4,
    'uncertain-transition': scene5,
    'q-learning': scene6,
    'td-targets': scene7,
    'exploration': scene8,
    'policy-gradient': scene9,
    'llm-policy': scene10,
    'off-policy-evaluation': scene11,
    'reward-design': scene12,
  },
});
