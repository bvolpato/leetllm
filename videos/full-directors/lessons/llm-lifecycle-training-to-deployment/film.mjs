import { prepareCaptions } from './captions.mjs';
import { art } from './art.mjs';
import { checkExamples } from './examples.mjs';
import { curate, tokens, allocation } from './training.mjs';
import { demonstration, mask, objectives } from './objectives.mjs';
import { overlap, judge, grade, release } from './evaluation.mjs';
import { capacity, rounding } from './compression.mjs';
import { batch, measurements, speculation, gateway } from './serving.mjs';
import { opening, symptoms, diagnosis, cache } from './trace.mjs';

const painters = {
  c01: opening,
  c02: curate,
  c03: tokens,
  c04: allocation,
  c05: demonstration,
  c06: mask,
  c07: objectives,
  c08: overlap,
  c09: judge,
  c10: grade,
  c11: release,
  c12: capacity,
  c13: rounding,
  c14: batch,
  c15: measurements,
  c16: speculation,
  c17: gateway,
  c18: symptoms,
  c19: diagnosis,
  c20: cache,
};
const light = new Set([
  'c02',
  'c03',
  'c05',
  'c06',
  'c08',
  'c09',
  'c10',
  'c11',
  'c13',
  'c17',
]);
export default {
  title: 'The LLM Lifecycle',
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    const id = clock.beat.chapterId;
    painters[id](art(ctx, clock, light.has(id)));
  },
  check: checkExamples,
};
