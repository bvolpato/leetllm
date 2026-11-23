import { checkExamples } from './examples.mjs';
import { opening, exhaustive, centers, lists, recovery, eligibility } from './neighborhood.mjs';
import { walk, hierarchy, insertion, scaleBudget } from './navigation.mjs';
import { quantize, adc } from './codec.mjs';
import { distributed, migration, finish } from './decisions.mjs';

const chapters = [
  opening,
  exhaustive,
  walk,
  hierarchy,
  insertion,
  centers,
  lists,
  recovery,
  scaleBudget,
  quantize,
  adc,
  eligibility,
  distributed,
  migration,
  finish,
];

export default {
  title: 'Finding Neighbors in a Large Vector Space',
  check: checkExamples,
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(2, 2);
    chapters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
};
