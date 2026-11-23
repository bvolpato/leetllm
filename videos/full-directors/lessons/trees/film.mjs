import { check } from './model.mjs';
import { prepareCaptions } from './captions.mjs';

import { opening, geometry, impurity, criteria, search, depth } from './splits.mjs';
import { forestScene, residuals, classification } from './ensembles.mjs';
import { validation, explanations, contracts, finalCase } from './decisions.mjs';

const scenes = [
  opening,
  geometry,
  impurity,
  criteria,
  search,
  depth,
  forestScene,
  residuals,
  classification,
  validation,
  explanations,
  contracts,
  finalCase,
];
export default {
  title: 'How Trees Learn to Divide a Space',
  preparePicture: prepareCaptions,

  check,
  draw(ctx, clock) {
    scenes[clock.beat.chapterIndex](ctx, clock);
  },
};
