import { opening, clocks, windowScene, lineage } from './conversation.mjs';
import { ranking, scope, paging } from './retrieval.mjs';
import { projection, recovery, returnVisit } from './lifecycle.mjs';
import { verify } from './memory.mjs';

const painters = {
  c01: opening,
  c02: clocks,
  c03: windowScene,
  lineage,
  c04: ranking,
  c05: scope,
  c06: paging,
  c07: projection,
  c08: recovery,
  return: returnVisit,
};

export default {
  title: 'Giving an Agent a Memory That Lasts',
  draw(ctx, clock) {
    painters[clock.beat.chapterId](ctx, clock);
  },
  check: verify,
};
