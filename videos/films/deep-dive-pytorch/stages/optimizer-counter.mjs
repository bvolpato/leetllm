import { saved } from '../arithmetic.mjs';
import { cueFraction } from '../cues.mjs';
import { drawStep, weightScale } from '../weight-scale.mjs';

export function drawOptimizerCounter(ctx, scene, state, api) {
  const { C } = api;
  const step = (id, b, a, z) => cueFraction(state, id, b, a, z);
  if (state.beat < 2) {
    api.focus.target('adam-moments', () => {
      api.text(ctx, 'w = 1       g = +0.5', 140, 289, 51, C.yellow);
      api.text(ctx, 'First moment', 140, 440, 38, C.blue);
      api.text(ctx, 'Second moment', 140, 579, 38, C.pink);
      const mean = step('adam-mean', 0, 0.33, 0.5) > 0,
        square = step('adam-square', 0, 0.66, 0.81) > 0;
      const cm = step('correct-mean', 1, 0.23, 0.4) > 0,
        cv = step('correct-square', 1, 0.42, 0.55) > 0;
      api.text(
        ctx,
        '0.9 × 0 + 0.1 × 0.5' + (mean ? ' = ' + saved.m.toFixed(2) : ''),
        505,
        440,
        39,
        C.ink,
      );
      api.text(
        ctx,
        '0.999 × 0 + 0.001 × 0.5²' + (square ? ' = ' + saved.v.toFixed(5) : ''),
        505,
        579,
        39,
        C.ink,
      );
      if (cm) api.text(ctx, '÷ (1 − 0.9¹) = 0.5', 1290, 440, 38, C.blue);
      if (cv) api.text(ctx, '÷ (1 − 0.999¹) = 0.25', 1290, 579, 38, C.pink);
      if (step('adam-count', 0, 0.83, 0.95) > 0) api.text(ctx, 'Update 1', 1390, 289, 41, C.yellow);
    });
    api.focus.target('adam-distance', () => {
      if (step('adam-direction', 1, 0.56, 0.69) > 0)
        api.text(ctx, 'd = 0.5 / (√0.25 + 0.00000001) ≈ 1', 960, 781, 50, C.ink, 'center');
      if (step('adam-displace', 1, 0.83, 0.96) > 0)
        api.text(ctx, '1 − 0.01 × d ≈ ' + saved.w.toFixed(2), 960, 929, 61, C.green, 'center');
    });
    return;
  }
  api.focus.target('adam-distance', () => {
    const start = 2,
      direction = 0.5,
      rates = [0.01, 0.02];
    api.text(
      ctx,
      'Same starting weight   2       •       Same direction   +0.5',
      135,
      298,
      47,
      C.ink,
    );
    const x = weightScale(ctx, api, [1.99, 1.995, 2], 790, 1700, 442, 826, 3);
    rates.forEach((rate, i) => {
      const y = 550 + i * 205,
        color = i ? C.pink : C.green,
        w = start - rate * direction;
      const p = step(i ? 'pt-rate-reset' : 'pt-rate-saved', 3, i ? 0.41 : 0.03, i ? 0.56 : 0.18);
      api.text(ctx, i ? 'Reset scheduler' : 'Saved scheduler', 145, y + 12, 42, color);
      api.text(ctx, 'Rate   ' + rate.toFixed(2), 145, y + 74, 34, C.muted);
      drawStep(ctx, api, x, y, start, w, p, color);
      if (p >= 1) api.text(ctx, w.toFixed(3), x(w) - 24, y + 14, 42, color, 'right');
    });
    api.text(
      ctx,
      state.beat === 2
        ? 'Which scheduler moves the weight farther?'
        : 'Next weight = starting weight − rate × direction',
      960,
      975,
      43,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'optimizer-counter',
  draw: drawOptimizerCounter,
  cues: [
    'adam-mean',
    'adam-square',
    'adam-count',
    'correct-mean',
    'correct-square',
    'adam-direction',
    'adam-displace',
    'rate-pair',
    'pt-rate-saved',
    'pt-rate-reset',
  ],
};
