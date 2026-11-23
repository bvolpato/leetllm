import { stageLesson } from '../lib/stage-lesson.mjs';
import { createDefaults } from '../films/kv-cache/defaults.mjs';
import { buildPhases } from '../films/kv-cache/stages/phases.mjs';
import { buildSize } from '../films/kv-cache/stages/size.mjs';
import { buildReserve } from '../films/kv-cache/stages/reserve.mjs';
import { buildPaged } from '../films/kv-cache/stages/paged.mjs';
import { buildKernel } from '../films/kv-cache/stages/kernel.mjs';
import { buildLifetime } from '../films/kv-cache/stages/lifetime.mjs';
import { buildBatching } from './kv-cache/batching.mjs';
import { buildPrefix } from '../films/kv-cache/stages/prefix.mjs';
import { buildPreempt } from '../films/kv-cache/stages/preempt.mjs';
import { buildShrink } from '../films/kv-cache/stages/shrink.mjs';
import { buildReads } from '../films/kv-cache/stages/reads.mjs';
import { buildYourTurn } from '../films/kv-cache/stages/your-turn.mjs';
import { buildHook, buildWaste } from './kv-cache/projections.mjs';
import { buildShare, buildClose } from './kv-cache/branches.mjs';
import { buildRecoveryCost } from './kv-cache/recovery.mjs';

export {
  LAYERS,
  HEADS,
  HEAD_SIZE,
  BYTES,
  QUERY_HEADS,
  PER_TOKEN,
  CONVERSATION,
  EIGHTY,
  BIG_LAYERS,
  BIG_QUERY_HEADS,
  BIG_PER_TOKEN,
  STEPS,
  RESERVED,
  USED,
  TRAPPED,
  SLOTS,
  PAGED_READ,
  PAST_THE_END,
  PROMPT_TOKENS,
  PREFIX_BLOCK,
  REQUESTS,
  FULL_BLOCKS,
  TAIL_TOKENS,
  NO_SHARING,
  WARM,
} from '../films/kv-cache/model.mjs';
export default stageLesson({ look: 'midnight', bloom: 0.12 }, (stage, narration) => {
  const defaults = createDefaults(stage);
  buildHook(stage, narration);
  buildWaste(stage, narration);
  buildPhases(stage, narration, defaults);
  const cache = buildSize(stage, narration, defaults);
  const pool = buildReserve(stage, narration, defaults);
  const locations = buildPaged(stage, narration, defaults, pool);
  buildKernel(stage, narration, defaults, locations);
  buildLifetime(stage, narration, defaults, pool, locations);
  buildBatching(stage, narration, defaults);
  buildShare(stage, narration);
  buildPrefix(stage, narration, defaults);
  buildPreempt(stage, narration, defaults, pool);
  buildRecoveryCost(stage, narration);
  buildShrink(stage, narration, defaults, cache);
  buildReads(stage, narration, defaults);
  buildYourTurn(stage, narration, defaults);
  buildClose(stage, narration);
});
