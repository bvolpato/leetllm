import { prepareLearningTheoryCaptions } from './captions.mjs';

import { opening, population, concentration, search, checkRouting } from './routing.mjs';
import { geometry, excess, growth, noise, checkCapacity } from './capacity.mjs';
import { interpolation, optimizer, checkInterpolation } from './interpolation.mjs';
import { planning, holdout, audit, release, checkEvaluation } from './evaluation.mjs';

const scenes = [
  opening,
  population,
  concentration,
  search,
  geometry,
  excess,
  growth,
  noise,
  interpolation,
  optimizer,
  planning,
  holdout,
  audit,
  release,
];

export default {
  title: 'Why a Winning Score Can Fade on New Data',
  preparePicture: prepareLearningTheoryCaptions,

  draw(ctx, clock) {
    scenes[clock.beat.chapterIndex](ctx, clock);
  },
  check() {
    checkRouting();
    checkCapacity();
    checkInterpolation();
    checkEvaluation();
  },
};
