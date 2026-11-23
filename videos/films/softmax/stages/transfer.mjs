import { FRESH_TARGET, LOGITS, PROBS, TARGET, WORDS } from '../fixtures.mjs';
import { lossTrace } from '../arithmetic.mjs';
import { freshState } from '../model.mjs';
import {
  bars,
  card,
  drawText,
  equation,
  header,
  target,
  withSoftmaxOriginalFrame,
} from '../defaults.mjs';
export function paintSoftmaxOriginalTransfer(
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
    const v = freshState(b === 1 ? amount('transfer-update') : 0),
      show = b > 0 || starts('transfer-forward'),
      observed = b > 0 || starts('transfer-target');
    header(ctx, api, C, 'The cat …');
    if (show) {
      target(ctx, api, 'fresh-distribution', () => bars(ctx, api, colors, v.probabilities, 475));
      drawText(
        ctx,
        api,
        C,
        'Fresh logits [' + v.logits.map((z) => z.toFixed(2)).join(', ') + ']',
        960,
        375,
        34,
        C.cyan,
        'center',
      );
    } else WORDS.forEach((word, i) => card(ctx, api, C, word, xs[i], 615, colors[i]));
    if (observed)
      target(ctx, api, 'fresh-target', () =>
        drawText(ctx, api, C, 'Observed: ate', 960, 910, 39, C.pink, 'center'),
      );
    if (b === 0)
      drawText(
        ctx,
        api,
        C,
        'Which score gets the upward correction?',
        960,
        1030,
        34,
        C.yellow,
        'center',
      );
    else if (!starts('transfer-gradient'))
      target(ctx, api, 'fresh-gradient', () =>
        drawText(ctx, api, C, 'Gradient calculation pending', 960, 1030, 30, C.muted, 'center'),
      );
    else if (starts('transfer-gradient'))
      target(ctx, api, 'fresh-gradient', () =>
        drawText(
          ctx,
          api,
          C,
          'ate: ' + v.before.probabilities[2].toFixed(3) + ' − 1 = ' + v.gradient[2].toFixed(3),
          960,
          1030,
          37,
          C.pink,
          'center',
        ),
      );
  } else {
    const fresh = freshState(0),
      product = PROBS[TARGET] * fresh.probabilities[FRESH_TARGET],
      l1 = lossTrace(LOGITS, TARGET).loss,
      l2 = fresh.loss;
    header(ctx, api, C, 'Initial predictions · two contributions');
    card(ctx, api, C, 'dog → slept', 510, 390, C.green, 470);
    card(ctx, api, C, 'cat → ate', 1410, 390, C.pink, 470);
    drawText(ctx, api, C, PROBS[TARGET].toFixed(3), 510, 500, 43, C.green, 'center');
    drawText(ctx, api, C, fresh.probabilities[2].toFixed(3), 1410, 500, 43, C.pink, 'center');
    if (!starts('transfer-product', p > 0.15))
      target(ctx, api, 'joint-probability', () =>
        drawText(ctx, api, C, 'Observed-word product pending', 960, 625, 30, C.muted, 'center'),
      );
    if (starts('transfer-product', p > 0.15))
      target(ctx, api, 'joint-probability', () =>
        drawText(
          ctx,
          api,
          C,
          'Observed-word product = ' + product.toFixed(3),
          960,
          625,
          40,
          C.cyan,
          'center',
        ),
      );
    if (!starts('transfer-loss-sum', p > 0.4))
      target(ctx, api, 'combined-loss', () =>
        drawText(ctx, api, C, 'Combined loss pending', 960, 850, 30, C.muted, 'center'),
      );
    if (starts('transfer-loss-sum', p > 0.4))
      target(ctx, api, 'combined-loss', () => {
        equation(ctx, api, C, '-\\log(p_1p_2)=-\\log p_1-\\log p_2', 960, 750, 43, C.yellow);
        drawText(
          ctx,
          api,
          C,
          l1.toFixed(3) + ' + ' + l2.toFixed(3) + ' = ' + (l1 + l2).toFixed(3),
          960,
          850,
          41,
          C.yellow,
          'center',
        );
        const x = 510,
          y = 910,
          w = 900;
        api.rect(ctx, x, y, (w * l1) / (l1 + l2), 45, C.green);
        api.rect(ctx, x + (w * l1) / (l1 + l2), y, (w * l2) / (l1 + l2), 45, C.pink);
      });
    if (!starts('transfer-mean', p > 0.7))
      target(ctx, api, 'mean-loss', () =>
        drawText(ctx, api, C, 'Mean calculation pending', 960, 1030, 30, C.muted, 'center'),
      );
    if (starts('transfer-mean', p > 0.7))
      target(ctx, api, 'mean-loss', () =>
        drawText(
          ctx,
          api,
          C,
          'Mean target loss: ' + ((l1 + l2) / 2).toFixed(3),
          960,
          1030,
          40,
          C.ink,
          'center',
        ),
      );
  }
}
export function drawTransferStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalTransfer);
}
export default {
  id: 'transfer',
  draw: drawTransferStage,
  cues: [
    'transfer-forward',
    'transfer-target',
    'transfer-gradient',
    'transfer-update',
    'transfer-product',
    'transfer-loss-sum',
    'transfer-mean',
  ],
};
