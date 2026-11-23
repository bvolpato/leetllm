import { base } from './drawing.mjs';
import { prepareCaptions } from './captions.mjs';
import { check } from './experiments.mjs';
import { opening, classifier, mixture, comparison, narrowing, gapStudy } from './observations.mjs';
import { expectation, maximization, jensen, ascent, iterations } from './fit.mjs';
import { precision, floor, starts, validate } from './diagnostics.mjs';
import { routes, latent } from './encoder.mjs';

const chapters = {
  c01: opening,
  c02: classifier,
  c03: mixture,
  c04: comparison,
  c05: narrowing,
  c06: expectation,
  c07: maximization,
  c08: jensen,
  c09: ascent,
  c10: iterations,
  c11: precision,
  c12: floor,
  c13: starts,
  c14: validate,
  c15: routes,
  c16: latent,
  c17: gapStudy,
  c18: (ctx, clock) => comparison(ctx, clock, true),
};

export default {
  title: 'Learn Hidden Groups One Soft Assignment at a Time',
  check,
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    base(ctx);
    chapters[clock.beat.chapterId](ctx, clock);
  },
};
