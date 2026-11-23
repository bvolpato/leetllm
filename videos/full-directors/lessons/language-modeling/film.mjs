import { prepareCaptions } from './captions.mjs';

import { check } from './examples.mjs';
import {
  opening,
  tokens,
  counts,
  vocabulary,
  sparse,
  adjective,
  neural,
  gradient,
  conflict,
} from './learning.mjs';
import {
  normalize,
  selection,
  objectives,
  sequence,
  teacher,
  shift,
  loss,
  pooling,
  generate,
  greedy,
} from './scoring.mjs';
import {
  lifecycle,
  parityCheck,
  work,
  storage,
  paging,
  windowBudget,
  evidence,
  dogPractice,
  fox,
} from './serving.mjs';

const chapters = [
  opening,
  tokens,
  counts,
  vocabulary,
  sparse,
  adjective,
  neural,
  gradient,
  conflict,
  normalize,
  selection,
  objectives,
  sequence,
  teacher,
  shift,
  loss,
  pooling,
  generate,
  greedy,
  lifecycle,
  parityCheck,
  work,
  storage,
  paging,
  windowBudget,
  evidence,
  dogPractice,
  fox,
];

export default {
  title: 'One More Word Changes the Question',
  check,
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    ctx.save();
    try {
      ctx.scale(2, 2);
      chapters[clock.beat.chapterIndex](ctx, clock);
    } finally {
      ctx.restore();
    }
  },
};
