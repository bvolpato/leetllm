import { verifyEvidence } from './evidence.mjs';
import { opening, indexView, routing, ranks, packing } from './search.mjs';
import { publication, latency, memory, cost } from './service.mjs';
import { evaluation, practice } from './practice.mjs';

const chapters = {
  c01: opening,
  c02: indexView,
  routing,
  c03: ranks,
  c04: packing,
  c05: publication,
  c06: latency,
  c07: memory,
  c08: cost,
  evaluation,
  practice,
};

export default {
  title: 'Search That Preserves the Rule and Its Exception',
  draw(ctx, clock) {
    chapters[clock.beat.chapterId](ctx, clock);
  },
  check() {
    verifyEvidence();
  },
};
