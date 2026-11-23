import { stageLesson } from '../../lib/stage-lesson.mjs';
import { createDefaults } from './defaults.mjs';
import { buildHook } from './stages/hook.mjs';
import { buildWaste } from './stages/waste.mjs';
import { buildPhases } from './stages/phases.mjs';
import { buildSize } from './stages/size.mjs';
import { buildReserve } from './stages/reserve.mjs';
import { buildPaged } from './stages/paged.mjs';
import { buildKernel } from './stages/kernel.mjs';
import { buildLifetime } from './stages/lifetime.mjs';
import { buildBatching } from './stages/batching.mjs';
import { buildShare } from './stages/share.mjs';
import { buildPrefix } from './stages/prefix.mjs';
import { buildPreempt } from './stages/preempt.mjs';
import { buildShrink } from './stages/shrink.mjs';
import { buildReads } from './stages/reads.mjs';
import { buildYourTurn } from './stages/your-turn.mjs';
import { buildClose } from './stages/close.mjs';
export default stageLesson(
  {
    look: 'midnight',
    bloom: 0.12,
  },
  (stage, narration) => {
    const defaults = createDefaults(stage);
    const sentenceWords = buildHook(stage, narration, defaults);
    buildWaste(stage, narration, defaults, sentenceWords);
    buildPhases(stage, narration, defaults);
    const cacheBlock = buildSize(stage, narration, defaults);
    const memoryPool = buildReserve(stage, narration, defaults);
    const pageLocations = buildPaged(stage, narration, defaults, memoryPool);
    buildKernel(stage, narration, defaults, pageLocations);
    buildLifetime(stage, narration, defaults, memoryPool, pageLocations);
    buildBatching(stage, narration, defaults);
    buildShare(stage, narration, defaults, memoryPool);
    buildPrefix(stage, narration, defaults);
    buildPreempt(stage, narration, defaults, memoryPool);
    buildShrink(stage, narration, defaults, cacheBlock);
    buildReads(stage, narration, defaults);
    buildYourTurn(stage, narration, defaults);
    buildClose(stage, narration, defaults, cacheBlock);
  },
);
