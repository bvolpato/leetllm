import { check } from './model.mjs';
import { opening, patches, connector, training, routes } from './feature-scenes.mjs';
import { budget, crops, reuse } from './serving-scenes.mjs';
import { attention, region, chronology, evaluation, practice } from './evidence-scenes.mjs';

const scenes = {
  c01: opening,
  c02: patches,
  c03: connector,
  'c03-training': training,
  c04: routes,
  c05: budget,
  'c05-crops': crops,
  'c05-reuse': reuse,
  c06: attention,
  c07: region,
  'c07-case': chronology,
  c08: evaluation,
  'c08-practice': practice,
};

export default {
  title: 'Bringing Different Senses into One Model',
  check,
  draw(ctx, clock) {
    scenes[clock.beat.chapterId](ctx, clock);
  },
};
