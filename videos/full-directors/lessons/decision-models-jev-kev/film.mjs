import { opening, release } from './recorder.mjs';
import { softmaxScene, descent, pointerScene, readouts } from './scoring.mjs';
import { options, training } from './experiments.mjs';
import { risk } from './risk.mjs';
import { verify } from './decisions.mjs';

const painters = [
  opening,
  softmaxScene,
  descent,
  pointerScene,
  readouts,
  options,
  training,
  risk,
  release,
];
export default {
  title: 'Turn Evidence into a Bounded Decision',
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(2, 2);
    painters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
  check: verify,
};
