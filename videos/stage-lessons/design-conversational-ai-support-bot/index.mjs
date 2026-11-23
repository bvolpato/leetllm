import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import channels from './scenes/channels-and-fences.mjs';
import state from './scenes/state.mjs';
import contract from './scenes/contract-and-fallback.mjs';
import evidence from './scenes/evidence.mjs';
import policy from './scenes/policy.mjs';
import reads from './scenes/parallel.mjs';
import ledger from './scenes/ledger.mjs';
import repair from './scenes/repair-and-status.mjs';
import handoff from './scenes/handoff.mjs';
import budget from './scenes/ticket-budget.mjs';
import evaluation from './scenes/evaluation.mjs';
import freshCase from './scenes/fresh-case.mjs';
export default narratedLesson({
  id: 'design-conversational-ai-support-bot',
  scenes: {
    intro,
    'channels-and-fences': channels,
    state,
    'contract-and-fallback': contract,
    evidence,
    policy,
    parallel: reads,
    ledger,
    'repair-and-status': repair,
    handoff,
    'ticket-budget': budget,
    evaluation,
    'fresh-case': freshCase,
  },
});
