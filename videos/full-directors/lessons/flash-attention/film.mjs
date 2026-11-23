import { drawWeightedArea, checkWeightedArea } from './weighted-area.mjs';
import { checkExamples } from './examples.mjs';
import { prompt, operator, bus, workingSet, stream, pipeline } from './prompt-and-memory.mjs';
import { partial, signed, reference, causal, cache } from './row-and-mask.mjs';
import { reconstruct, derivatives, scale, timing } from './backward-and-cost.mjs';

const painters = {
  c01: prompt,
  c02: operator,
  c03: bus,
  'c03-fit': workingSet,
  c04: stream,
  'c04-pipe': pipeline,
  c05: partial,
  c06: signed,
  'c06-ref': reference,
  c07: causal,
  'c07-cache': cache,
  c08: reconstruct,
  'c08-grad': derivatives,
  'c08-scale': scale,
  'c08-time': timing,
};

export default {
  title: 'Attention That Moves Less Data',
  draw(ctx, clock) {
    if (drawWeightedArea(ctx, clock)) return;
    painters[clock.beat.chapterId](ctx, clock);
  },
  check() {
    checkWeightedArea();
    checkExamples();
    return true;
  },
};
