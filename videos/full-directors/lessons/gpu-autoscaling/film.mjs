import { opening, startupChart, pool, morning, finalPractice } from './queue.mjs';
import { entry, controller, drain } from './workers.mjs';
import { memory, delivery, benchmark, slotTrace } from './measurement.mjs';
import { checkExamples } from './examples.mjs';

function synthesis(ctx, clock) {
  const index = clock.beat.beatIndex;
  if (index < 2) return morning(ctx, clock);
  if (index < 4) return delivery(ctx, clock);
  if (index < 6) return benchmark(ctx, clock);
  if (index < 8) return slotTrace(ctx, clock);
  return finalPractice(ctx, clock);
}
const painters = [opening, entry, startupChart, pool, controller, memory, drain, synthesis];
export default {
  title: 'Capacity That Arrives Before the Queue Expires',
  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check: checkExamples,
};
