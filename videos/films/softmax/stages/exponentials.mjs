import { WORDS } from '../fixtures.mjs';
import { exponentialState } from '../model.mjs';
import {
  card,
  drawText,
  equation,
  header,
  target,
  withSoftmaxOriginalFrame,
} from '../defaults.mjs';
export function paintSoftmaxOriginalExponentials(
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
  const v = exponentialState(b, p, cues);
  header(
    ctx,
    api,
    C,
    b === 0 ? 'Scores become positive weights' : 'Subtract one maximum before exponentiating',
  );
  target(ctx, api, 'exponential-inputs', () =>
    WORDS.forEach((word, i) => {
      drawText(ctx, api, C, word, xs[i], 350, 39, colors[i], 'center');
      card(ctx, api, C, v.raw[i].toFixed(1), xs[i], 460, colors[i]);
    }),
  );
  if (b > 0)
    target(ctx, api, 'shifted-weights', () =>
      WORDS.forEach((_, i) =>
        equation(
          ctx,
          api,
          C,
          `${v.raw[i].toFixed(1)}-${v.shift.toFixed(1)}=${v.shifted[i].toFixed(1)}`,
          xs[i],
          620,
          36,
          colors[i],
        ),
      ),
    );
  WORDS.forEach((_, i) => {
    api.arrow(ctx, xs[i], b > 0 ? 660 : 535, xs[i], 718, C.muted, 3);
    if (i < v.shown)
      target(ctx, api, 'positive-weight-' + i, () =>
        equation(
          ctx,
          api,
          C,
          `e^{${v.shifted[i].toFixed(2)}}\\approx${v.weights[i].toFixed(3)}`,
          xs[i],
          810,
          41,
          colors[i],
        ),
      );
    else drawText(ctx, api, C, 'weight ?', xs[i], 810, 38, C.muted, 'center');
  });
  if (v.shown === 3)
    drawText(
      ctx,
      api,
      C,
      'ran weight / slept weight = ' + (v.weights[0] / v.weights[1]).toFixed(3),
      960,
      965,
      35,
      C.yellow,
      'center',
    );
  if (b === 2 && starts('exp-offset'))
    drawText(
      ctx,
      api,
      C,
      'Direct exp(' +
        v.raw[0].toFixed(0) +
        ') = ' +
        String(Math.exp(v.raw[0])) +
        ' · shifted calculation stays finite',
      960,
      1040,
      27,
      C.pink,
      'center',
    );
}
export function drawExponentialsStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalExponentials);
}
export default {
  id: 'exponentials',
  draw: drawExponentialsStage,
  cues: ['exp-ran', 'exp-slept', 'exp-ate', 'exp-shift', 'exp-offset'],
};
