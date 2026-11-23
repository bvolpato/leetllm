import { prepareCaptions } from './captions.mjs';

import { checkReplay } from './replay.mjs';
import { arrivals, coefficients, residuals, loss } from './timing.mjs';
import { descent, solve, cost, steps } from './solver.mjs';
import { bend, penalty, statistics, heldout } from './decisions.mjs';

const chapters = [
  arrivals,
  coefficients,
  residuals,
  loss,
  descent,
  solve,
  cost,
  steps,
  bend,
  penalty,
  statistics,
  heldout,
];

export default {
  title: 'How a Line Learns to Predict',
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](ctx, clock);
  },
  check: checkReplay,
  preparePicture: prepareCaptions,
};
