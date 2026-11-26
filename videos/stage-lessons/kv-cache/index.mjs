// Cinematic Vizmatic stage lesson for KV Cache & PagedAttention (all 17 scenes).
import { cinematicLesson, COSMOS } from '../cinematic-kit.mjs';
import { verifyKvCacheInvariants } from './parts.mjs';
import batching from './scenes/batching.mjs';
import close from './scenes/close.mjs';
import hook from './scenes/hook.mjs';
import kernel from './scenes/kernel.mjs';
import lifetime from './scenes/lifetime.mjs';
import paged from './scenes/paged.mjs';
import phases from './scenes/phases.mjs';
import preempt from './scenes/preempt.mjs';
import prefix from './scenes/prefix.mjs';
import reads from './scenes/reads.mjs';
import recoveryCost from './scenes/recovery-cost.mjs';
import reserve from './scenes/reserve.mjs';
import share from './scenes/share.mjs';
import shrink from './scenes/shrink.mjs';
import size from './scenes/size.mjs';
import waste from './scenes/waste.mjs';
import yourTurn from './scenes/your-turn.mjs';

export default cinematicLesson({
  id: 'kv-cache',
  accent: COSMOS.cyan,
  invariants: verifyKvCacheInvariants,
  scenes: {
    hook,
    waste,
    phases,
    size,
    reserve,
    paged,
    kernel,
    lifetime,
    batching,
    share,
    prefix,
    preempt,
    'recovery-cost': recoveryCost,
    shrink,
    reads,
    'your-turn': yourTurn,
    close,
  },
});
