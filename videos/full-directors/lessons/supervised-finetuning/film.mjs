import { painter } from './printshop.mjs';
import { checkExamples } from './examples.mjs';
import {
  opening,
  split,
  compress,
  template,
  shift,
  mask,
  losses,
  pad,
  active,
  dilution,
} from './demonstration.mjs';
import { surface, join, perturb, batch, budget, recipe } from './training.mjs';
import { restart, restore, memory, evaluation, checkpoint, practice } from './validation.mjs';

const chapters = {
  c01: opening,
  c02: split,
  c03: compress,
  c04: template,
  c05: shift,
  c06: mask,
  c07: losses,
  c08: pad,
  c09: active,
  c10: dilution,
  c11: surface,
  c12: join,
  c13: perturb,
  c14: batch,
  c15: budget,
  c16: recipe,
  c17: restart,
  c18: restore,
  c19: memory,
  c20: evaluation,
  c21: checkpoint,
  c22: (p, k) => pad(p, k, true),
  c23: practice,
};
export default {
  title: 'Teaching a Model to Follow Instructions',
  preparePicture(schedule) {
    for (const entry of schedule) {
      if (entry.beat.id === 'c14-b01') entry.markCaption('what should we divide');
      if (entry.beat.id === 'c14-b03') entry.markCaption('divide its four');
    }
  },
  draw(ctx, clock) {
    const p = painter(ctx);
    p.init();
    chapters[clock.beat.chapterId](p, clock);
  },
  check: checkExamples,
};
