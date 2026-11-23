import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import intake from './scenes/intake.mjs';
import sourceEvidence from './scenes/source-evidence.mjs';
import loop from './scenes/loop.mjs';
import dispatch from './scenes/dispatch.mjs';
import approval from './scenes/approval.mjs';
import replay from './scenes/replay.mjs';
import expiry from './scenes/expiry.mjs';
import traceBudget from './scenes/trace-budget.mjs';
import evaluation from './scenes/evaluation.mjs';
import releaseMutations from './scenes/release-mutations.mjs';
import operationalContract from './scenes/operational-contract.mjs';
import synthesis from './scenes/synthesis.mjs';

export default narratedLesson({
  id: 'capstone-production-llm-agent',
  scenes: {
    'intro': intro,
    'intake': intake,
    'source-evidence': sourceEvidence,
    'loop': loop,
    'dispatch': dispatch,
    'approval': approval,
    'replay': replay,
    'expiry': expiry,
    'trace-budget': traceBudget,
    'evaluation': evaluation,
    'release-mutations': releaseMutations,
    'operational-contract': operationalContract,
    'synthesis': synthesis,
  },
});
