import { WORDS } from '../fixtures.mjs';
import {
  drawCompleteArrow,
  drawCompleteBox,
  drawCompleteEquation,
  drawCompleteHead,
  drawCompleteNote,
  drawCompleteRow,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteSmoothingEquilibrium(
  ctx,
  scene,
  state,
  api,
  C,
  m,
  f,
  b,
  colors,
  xs,
  started,
  progress,
) {
  drawCompleteHead(
    ctx,
    api,
    C,
    b === 0
      ? 'Mix target mass before changing the objective'
      : b === 1
        ? 'Match the new target, then follow the sign change'
        : 'Relative gaps stay fixed under a shared shift',
  );
  if (b === 0) {
    const a = 0.1 * progress('smooth-mixture'),
      values = [a / 3, 1 - a + a / 3, a / 3];
    drawCompleteRow(ctx, api, C, colors, xs, values, 430, WORDS, 240);
    drawCompleteText(ctx, api, C, 'α = ' + a.toFixed(3), 960, 830, 36, C.yellow, 'center');
    if (started('smooth-mixture'))
      drawCompleteEquation(ctx, api, C, '\\tilde y=(1-\\alpha)y+\\alpha/K', 960, 950, 43, C.cyan);
  } else if (b === 1) {
    const overshoot = progress('smooth-overshoot'),
      target = m.smooth[1],
      probability = target + overshoot * (0.98 - target),
      q = [(1 - probability) / 2, probability, (1 - probability) / 2];
    drawCompleteRow(ctx, api, C, colors, xs, q, 395, WORDS, 190);
    drawCompleteText(
      ctx,
      api,
      C,
      'smoothed target slept = ' + target.toFixed(6),
      960,
      730,
      33,
      C.green,
      'center',
    );
    if (started('smooth-gap')) {
      drawCompleteText(
        ctx,
        api,
        C,
        'target ratio 28 · equilibrium gap ' + m.smoothGap.toFixed(6),
        960,
        825,
        33,
        C.cyan,
        'center',
      );
    }
    if (started('smooth-overshoot'))
      drawCompleteText(
        ctx,
        api,
        C,
        'p − ỹ = +' + (probability - target).toFixed(6) + ' → descent lowers slept',
        960,
        915,
        34,
        C.yellow,
        'center',
      );
    if (started('smooth-minimum'))
      drawCompleteText(
        ctx,
        api,
        C,
        'minimum loss H(ỹ) = ' + m.smoothEntropy.toFixed(6) + ' nats',
        960,
        995,
        30,
        C.muted,
        'center',
      );
  } else {
    const offset = 1000 * progress('smooth-shift'),
      logits = [offset, offset + m.smoothGap, offset];
    WORDS.forEach((w, i) => {
      drawCompleteText(ctx, api, C, w, xs[i], 375, 32, colors[i], 'center');
      drawCompleteBox(ctx, api, C, logits[i].toFixed(3), xs[i], 495, 360, 100, colors[i], 39);
    });
    drawCompleteText(
      ctx,
      api,
      C,
      'slept − competitor = ' + m.smoothGap.toFixed(6),
      960,
      665,
      36,
      C.cyan,
      'center',
    );
    if (started('smooth-support')) {
      drawCompleteBox(ctx, api, C, 'positive target', 530, 815, 430, 90, C.yellow, 33);
      drawCompleteArrow(ctx, api, C, 790, 815, 1110, 815, C.pink);
      drawCompleteBox(ctx, api, C, 'excluded candidate', 1390, 815, 430, 90, C.pink, 31);
      drawCompleteText(
        ctx,
        api,
        C,
        'incompatible support → infinite mathematical loss',
        960,
        955,
        34,
        C.pink,
        'center',
      );
    }
    drawCompleteNote(
      ctx,
      api,
      C,
      'The example constrains relative logits. Calibration and distillation require task evidence.',
    );
  }
}
export function drawSmoothingEquilibriumStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteSmoothingEquilibrium);
}
export default {
  id: 'smoothing-equilibrium',
  draw: drawSmoothingEquilibriumStage,
  cues: [
    'smoothing-equilibrium-0',
    'smooth-mixture',
    'smoothing-equilibrium-1',
    'smooth-gap',
    'smooth-overshoot',
    'smooth-minimum',
    'smoothing-equilibrium-2',
    'smooth-shift',
    'smooth-support',
  ],
};
