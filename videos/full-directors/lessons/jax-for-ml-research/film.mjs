import { instrument } from './drawing.mjs';
import { checkExperiments } from './experiments.mjs';
import { opening, finalPractice, boundary, oracle, pulls, transforms, trees, metadata, arrays } from './regression.mjs';
import { draws, derivation, owners, training, momentum, shape, masking } from './state.mjs';
import { compilation, captured, weak, branch, logarithm, loops, shards } from './transforms.mjs';
import { regularizer, stopwatch, benchmark, replay } from './measure.mjs';

const chapters = [
  opening, boundary, oracle, pulls, transforms, trees, metadata, arrays, g => arrays(g,true),
  draws, derivation, owners, training, momentum, shape, masking, compilation, captured, weak,
  g => captured(g,true), branch, logarithm, loops, shards, regularizer, stopwatch, benchmark,
  replay, finalPractice,
];

export default {
  title: 'Read JAX as an Explicit Numerical Program',
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](instrument(ctx, clock));
  },
  check: checkExperiments,
};
