import { opening, projection, phases, sizing } from './projection.mjs';
import { waste, mapping, reading, lifetime } from './placement.mjs';
import { batching, branches, prefixes, exhaustion } from './ownership.mjs';
import { shrink, growing, practice } from './capacity.mjs';
import { checkMechanics } from './mechanics.mjs';

const chapters = [
  opening,
  projection,
  phases,
  sizing,
  waste,
  mapping,
  reading,
  lifetime,
  batching,
  branches,
  prefixes,
  exhaustion,
  shrink,
  growing,
  practice,
  (ctx, clock) => branches(ctx, clock, true),
];
export default {
  title: 'The Memory Behind Every Generated Token',
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](ctx, clock);
  },
  check: checkMechanics,
};
