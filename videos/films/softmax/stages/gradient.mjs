import { GRAD, PROBS, TARGET, WORDS } from '../fixtures.mjs';
import { gradientState } from '../model.mjs';
import {
  card,
  drawText,
  equation,
  header,
  target,
  withSoftmaxOriginalFrame,
} from '../defaults.mjs';
export function paintSoftmaxOriginalGradient(
  ctx,
  scene,
  state,
  api,
  C,
  b,
  p,
  cues,
  colors,
  xs,
  amount,
  starts,
) {
  const v = gradientState(b, p, cues);
  header(ctx, api, C, 'Probability − observed target');
  WORDS.forEach((word, i) => {
    drawText(ctx, api, C, word, xs[i], 355, 40, colors[i], 'center');
    drawText(ctx, api, C, PROBS[i].toFixed(3), xs[i], 445, 43, colors[i], 'center');
  });
  if (v.targetKnown)
    target(ctx, api, 'one-hot-target', () =>
      WORDS.forEach((_, i) => {
        card(
          ctx,
          api,
          C,
          '− ' + Number(i === TARGET),
          xs[i],
          530,
          i === TARGET ? C.green : C.muted,
          230,
          80,
          36,
        );
      }),
    );
  WORDS.forEach((_, i) => {
    if (!v.shown[i] && cues?.['gradient-' + i]?.phase === 'during')
      target(ctx, api, 'logit-gradient-' + i, () =>
        drawText(ctx, api, C, 'gradient pending', xs[i], 645, 29, C.muted, 'center'),
      );
    if (v.shown[i])
      target(ctx, api, 'logit-gradient-' + i, () => {
        drawText(
          ctx,
          api,
          C,
          (GRAD[i] >= 0 ? '+' : '') + GRAD[i].toFixed(3),
          xs[i],
          645,
          46,
          colors[i],
          'center',
        );
        api.line(ctx, xs[i] - 115, 790, xs[i] + 115, 790, C.muted, 2);
        api.rect(
          ctx,
          xs[i] - 38,
          Math.min(790, 790 - 115 * GRAD[i]),
          76,
          Math.abs(115 * GRAD[i]),
          colors[i],
        );
        drawText(ctx, api, C, '0', xs[i] + 135, 800, 26, C.muted, 'center');
      });
  });
  if (b === 2)
    target(ctx, api, 'gradient-balance', () => {
      const pos = 350,
        width = 1200;
      let x = pos;
      v.parts.forEach((part, i) => {
        const next = x + part * width,
          y = 950 + i * 22;
        if (Math.abs(next - x) > 2) api.arrow(ctx, x, y, next, y, colors[i], 5);
        x = next;
      });
      drawText(
        ctx,
        api,
        C,
        'Running gradient sum: ' + (Math.abs(v.sum) < 0.0005 ? '0.000' : v.sum.toFixed(3)),
        1260,
        1020,
        31,
        C.yellow,
        'center',
      );
    });
  else equation(ctx, api, C, '\\nabla_z L=p-y', 960, 1020, 46, C.cyan);
}
export function drawGradientStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalGradient);
}
export default {
  id: 'gradient',
  draw: drawGradientStage,
  cues: ['gradient-target', 'gradient-0', 'gradient-1', 'gradient-2', 'gradient-balance'],
};
