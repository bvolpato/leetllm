import { check } from './decisions.mjs';
import { opening, surfaces, cascade, categoryScores, inputs } from './evidence.mjs';
import { batching, overload, errors } from './queues.mjs';
import { birds, cache, appeals, finalPractice } from './publication.mjs';
import { fusionWorksheet, release } from './policy.mjs';

const scenes = {
  c01: opening,
  c02: surfaces,
  c03: cascade,
  c04: categoryScores,
  'c04-inputs': inputs,
  'c04-fusion': fusionWorksheet,
  c05: batching,
  c06: overload,
  c07: errors,
  c08: birds,
  'c08-cache': cache,
  'c08-appeal': appeals,
  'c09-release': release,
  c09: finalPractice,
};

export default {
  title: 'Moderation as a Timed Decision System',
  check,
  draw(ctx, clock) {
    scenes[clock.beat.chapterId](ctx, clock);
  },
};
