import { prepareCaptions } from './captions.mjs';

import { backdrop, timing } from './drawing.mjs';
import { checkModel } from './model.mjs';
import { station } from './platform.mjs';
import {
  split,
  scores,
  quantile,
  indexing,
  interval,
  exchange,
  ties,
  coverage,
} from './calibration.mjs';
import { individual, inversion, crossing } from './classes.mjs';
import { groups, scale, shift } from './traffic.mjs';
import { risk, threshold, selected } from './routing.mjs';
import { transfer, final } from './deadline.mjs';

const chapters = [
  station,
  split,
  scores,
  quantile,
  indexing,
  interval,
  exchange,
  ties,
  coverage,
  individual,
  inversion,
  crossing,
  groups,
  scale,
  shift,
  risk,
  threshold,
  selected,
  transfer,
  final,
];

export default {
  title: 'Prediction Sets with Measured Coverage',
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(2, 2);
    backdrop(ctx);
    chapters[clock.beat.chapterIndex](ctx, timing(clock));
    ctx.restore();
  },
  check: checkModel,
  preparePicture: prepareCaptions,
};
