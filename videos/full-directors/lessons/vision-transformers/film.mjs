import { checkPixelLens, drawPixelLens } from './pixel-lens.mjs';
import { C, rect } from './canvas.mjs';
import { checkPatches, shapes, convolution, projection, rank, practice } from './patch-reader.mjs';
import {
  checkEncoder,
  positions,
  resize,
  rotary,
  attention,
  residual,
  bias,
  granularity,
} from './encoder.mjs';
import {
  checkSupervision,
  alignment,
  candidates,
  sigmoid,
  variable,
  padding,
  features,
} from './supervision.mjs';
import { checkBridge, families, cache, bridges } from './bridge.mjs';

const painters = {
  c03: shapes,
  c04: convolution,
  c05: projection,
  c06: rank,
  c07: positions,
  c08: resize,
  c09: rotary,
  c10: attention,
  c11: residual,
  c12: bias,
  c13: granularity,
  c14: alignment,
  c15: candidates,
  c16: sigmoid,
  c17: variable,
  c18: padding,
  c19: features,
  c20: families,
  c21: cache,
  c22: bridges,
  c23: practice,
};
export default {
  title: 'Turning an Image into a Sequence',
  draw(ctx, clock) {
    if (drawPixelLens(ctx, clock)) return;
    rect(ctx, 0, 0, 1920, 1080, C.bg);
    painters[clock.beat.chapterId](ctx, clock);
  },
  preparePicture(schedule) {
    schedule.find(({ beat }) => beat.id === 'c18-b01').markCaption('and the pooled vector');
  },
  check() {
    checkPixelLens();
    checkPatches();
    checkEncoder();
    checkSupervision();
    checkBridge();
    return true;
  },
};
