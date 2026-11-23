import { LOGITS, PROBS, TARGET } from '../fixtures.mjs';
import { lossTrace } from '../arithmetic.mjs';
import {
  card,
  drawText,
  equation,
  header,
  target,
  withSoftmaxOriginalFrame,
} from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function paintSoftmaxOriginalLoss(
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
  if (b < 2) {
    const plot = api.teaching.axes({
      x: 240,
      y: 380,
      width: 940,
      height: 430,
      xDomain: [0, 1.05],
      yDomain: [0, 5],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 2, 4],
      xLabel: 'target probability',
      yLabel: 'loss',
      fontSize: 28,
    });
    api.teaching.curve({
      plot,
      points: sampleFunction((x) => -Math.log(x), 0.008, 1, 160),
      color: C.yellow,
      progress: 1,
    });
    const known = b > 0 || starts('loss-favorite');
    const move = b === 0 ? 0 : amount('loss-observed'),
      probability = PROBS[0] + (PROBS[1] - PROBS[0]) * move;
    if (known) {
      const point = plot.point(probability, -Math.log(probability));
      target(ctx, api, 'target-loss-point', () =>
        api.circle(ctx, point.x, point.y, 15, move === 0 ? C.blue : C.green),
      );
      drawText(
        ctx,
        api,
        C,
        move === 0 ? 'If ran appeared' : move < 1 ? 'Move toward slept' : 'Observed: slept',
        1480,
        430,
        35,
        move === 0 ? C.blue : C.green,
        'center',
      );
      equation(ctx, api, C, 'L=-\\log p_{\\rm target}', 1480, 575, 42, C.yellow);
      drawText(ctx, api, C, 'p = ' + probability.toFixed(3), 1480, 700, 38, C.ink, 'center');
      target(ctx, api, 'target-loss-value', () =>
        drawText(
          ctx,
          api,
          C,
          'loss = ' + (-Math.log(probability)).toFixed(3),
          1480,
          800,
          41,
          C.green,
          'center',
        ),
      );
    }
    drawText(ctx, api, C, 'A smaller target share costs more.', 960, 1000, 36, C.ink, 'center');
  } else {
    const extreme = starts('loss-extreme', p > 0.75),
      z = extreme ? [1000, 0, -1] : LOGITS,
      v = lossTrace(z, TARGET);
    header(
      ctx,
      api,
      C,
      extreme
        ? 'A tiny target weight can still have a finite loss'
        : 'Keep the calculation in log space',
    );
    drawText(
      ctx,
      api,
      C,
      'Logits [' + z.join(', ') + '] · observed slept',
      960,
      385,
      37,
      C.green,
      'center',
    );
    equation(ctx, api, C, 'L=(m-z_{\\rm target})+\\log\\sum_j e^{z_j-m}', 960, 485, 45, C.ink);
    if (cues?.['loss-gap']?.phase === 'during')
      target(ctx, api, 'loss-gap', () =>
        drawText(ctx, api, C, 'gap pending', 550, 680, 29, C.muted, 'center'),
      );
    if (starts('loss-gap', p > 0.15))
      target(ctx, api, 'loss-gap', () => {
        card(ctx, api, C, (v.max - z[TARGET]).toFixed(3), 550, 670, C.yellow, 360, 110, 46);
        drawText(ctx, api, C, 'maximum − target', 550, 785, 31, C.yellow, 'center');
      });
    drawText(ctx, api, C, '+', 960, 680, 54, C.ink, 'center');
    if (cues?.['loss-log-total']?.phase === 'during') {
      target(ctx, api, 'loss-log-total', () =>
        drawText(ctx, api, C, 'log total pending', 1370, 680, 29, C.muted, 'center'),
      );
      target(ctx, api, 'target-loss-value', () =>
        drawText(ctx, api, C, 'Target loss pending', 960, 940, 32, C.muted, 'center'),
      );
    }
    if (starts('loss-log-total', p > 0.4)) {
      target(ctx, api, 'loss-log-total', () => {
        card(ctx, api, C, v.logTotal.toFixed(3), 1370, 670, C.cyan, 360, 110, 46);
        drawText(ctx, api, C, 'log(' + v.total.toFixed(3) + ')', 1370, 785, 33, C.cyan, 'center');
      });
      target(ctx, api, 'target-loss-value', () =>
        drawText(
          ctx,
          api,
          C,
          'Target loss = ' + v.loss.toFixed(3),
          960,
          940,
          47,
          C.green,
          'center',
        ),
      );
    }
    if (extreme)
      target(ctx, api, 'stable-extreme', () =>
        drawText(
          ctx,
          api,
          C,
          'exp(−1000) rounds to 0 · log-space loss = 1000',
          960,
          1040,
          30,
          C.pink,
          'center',
        ),
      );
  }
}
export function drawLossStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalLoss);
}
export default {
  id: 'loss',
  draw: drawLossStage,
  cues: ['loss-favorite', 'loss-observed', 'loss-gap', 'loss-log-total', 'loss-extreme'],
};
