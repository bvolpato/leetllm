import { toolsFor } from './ink.mjs';
import { check } from './evidence.mjs';
import { reader, variants, ranks, coverage, endpoints, access, stepBack } from './retrieval.mjs';
import { vectors, drift, reflection, critique, router, refine, boundaries } from './correction.mjs';
import { latency, release, finalLookup } from './decisions.mjs';

const chapters = [
  reader,
  (p) => reader(p, true),
  variants,
  ranks,
  coverage,
  endpoints,
  access,
  stepBack,
  vectors,
  drift,
  reflection,
  critique,
  router,
  refine,
  boundaries,
  latency,
  release,
  finalLookup,
];

export default {
  title: 'Repairing Retrieval with Rewrites, HyDE, Self-RAG, and CRAG',
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(2, 2);
    chapters[clock.beat.chapterIndex](toolsFor(ctx, clock));
    ctx.restore();
  },
  check,
};
