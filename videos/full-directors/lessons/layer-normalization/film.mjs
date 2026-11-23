import { base } from './instrument.mjs';
import { check } from './experiments.mjs';
import { writes, centering, scale, gains, reduction } from './feature-bench.mjs';
import { placement, reverse, rmsNorm, derivatives } from './routes.mjs';
import { depth, deepNorm, peri } from './depth-and-attention.mjs';
import { precision, atHead } from './checkpoint.mjs';

const painters = {
  c01: writes,
  c02: centering,
  c03: scale,
  c04: gains,
  c05: reduction,
  c06: placement,
  c07: reverse,
  c08: rmsNorm,
  c09: derivatives,
  c10: depth,
  c11: deepNorm,
  c12: peri,
  c13: precision,
  c14: atHead,
};
export default {
  title: 'Keeping a Layer on a Useful Scale',
  check,
  draw(ctx, clock) {
    base(ctx);
    painters[clock.beat.chapterId](ctx, clock);
  },
};
