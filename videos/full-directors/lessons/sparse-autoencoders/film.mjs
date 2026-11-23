import { ground } from './drawing.mjs';
import { check } from './experiment.mjs';
import { opening, packing, dictionaryLesson, objective, shrinkage } from './geometry.mjs';
import { selection, gated, ablation, steering, clampGradient } from './interventions.mjs';
import { coverage, hooks, training, finale } from './audits.mjs';

const chapters = [
  opening,
  packing,
  dictionaryLesson,
  objective,
  shrinkage,
  selection,
  gated,
  ablation,
  steering,
  clampGradient,
  coverage,
  hooks,
  training,
  finale,
];

export default {
  title: 'Separating Features Inside a Model',
  draw(ctx, clock) {
    ground(ctx);
    chapters[clock.beat.chapterIndex](ctx, clock);
  },
  check,
};
