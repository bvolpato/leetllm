import { check } from './model.mjs';
import { paintEditor } from './sprite-editor.mjs';
import { lanes, infill, position, allocation, upload } from './context.mjs';
import { timing, quantiles, cached, speculative, fleet } from './serving.mjs';
import { outcomes, release } from './outcomes.mjs';

const painters = {
  c01: paintEditor,
  c02: lanes,
  c03: infill,
  'c03-units': position,
  c04: allocation,
  'c04-upload': upload,
  c05: paintEditor,
  c06: timing,
  'c06-traces': quantiles,
  c07: cached,
  'c07-draft': speculative,
  'c07-fleet': fleet,
  c08: outcomes,
  'c08-release': release,
  c09: paintEditor,
};
export default {
  title: 'A Suggestion Must Match the Editor Now',
  draw(ctx, clock) {
    painters[clock.beat.chapterId](ctx, clock);
  },
  check,
};
