// Cinematic Vizmatic 0.10.0 stage film for Mixed Precision Training (14 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyMixedPrecisionInvariants } from './parts.mjs';
import communication from './scenes/communication.mjs';
import controller from './scenes/controller.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';
import formats from './scenes/formats.mjs';
import fp8Contract from './scenes/fp8-contract.mjs';
import grid from './scenes/grid.mjs';
import intro from './scenes/intro.mjs';
import memory from './scenes/memory.mjs';
import ordering from './scenes/ordering.mjs';
import policyMismatch from './scenes/policy-mismatch.mjs';
import rangeCheck from './scenes/range-check.mjs';
import transfer from './scenes/transfer.mjs';
import underflow from './scenes/underflow.mjs';
import update from './scenes/update.mjs';

export default cinematicLesson({
  id: 'mixed-precision',
  accent: COSMOS.cyan,
  invariants: verifyMixedPrecisionInvariants,
  scenes: {
    intro,
    grid,
    formats,
    'range-check': rangeCheck,
    underflow,
    update,
    controller,
    ordering,
    memory,
    transfer,
    communication,
    'policy-mismatch': policyMismatch,
    'fp8-contract': fp8Contract,
    'earned-transfer': earnedTransfer,
  },
});
