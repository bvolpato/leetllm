import { exampleGradients } from '../arithmetic.mjs';
import { rows } from '../fixtures.mjs';
import { drawArrow, drawBox, drawLine, drawMatrix, drawText, mark } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';
export function drawTransformOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const paint = () => {
    if (currentBeat === 0) {
      drawMatrix(ctx, api, [3.75], 220, 430, {
        cw: 180,
        ch: 120,
        color: themeColors.green,
        label: 'scalar output · shape ()',
      });
      drawMatrix(ctx, api, [3.75], 1180, 430, {
        cw: 180,
        ch: 120,
        color: themeColors.pink,
        label: 'one-element vector · shape [1]',
      });
      drawArrow(ctx, api, 430, 490, 760, 490, themeColors.green);
      drawBox(ctx, api, 'grad accepted', 790, 440, 330, 100, themeColors.green);
      drawLine(ctx, api, 1430, 600, 1430, 690, themeColors.pink, 4);
      drawText(ctx, api, 'grad rejects vector-valued loss', 1340, 770, 32, themeColors.pink);
      drawBox(
        ctx,
        api,
        'value-and-grad → scalar + gradient tree',
        430,
        855,
        1060,
        85,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      const gs = exampleGradients();
      drawMatrix(
        ctx,
        api,
        rows.map((r) => r.x),
        180,
        385,
        {
          cw: 95,
          ch: 100,
          label: 'mapped rows',
        },
      );
      drawMatrix(
        ctx,
        api,
        gs.map((g) => g.slice(0, 2)),
        800,
        385,
        {
          cw: 160,
          ch: 100,
          color: themeColors.pink,
          label: 'weight gradients [4,2]',
          known: resultAfter(state, 'transform-mapped-shape'),
        },
      );
      drawMatrix(
        ctx,
        api,
        gs.map((g) => [g[2]]),
        1420,
        385,
        {
          cw: 150,
          ch: 100,
          color: themeColors.pink,
          label: 'bias gradients [4]',
        },
      );
      drawText(
        ctx,
        api,
        'mapped axes = (None, 0, 0) · one shared parameter tree',
        960,
        930,
        32,
        themeColors.yellow,
      );
    } else {
      drawMatrix(ctx, api, [-4.5, -1.5], 200, 405, {
        cw: 170,
        ch: 100,
        color: themeColors.pink,
        label: 'grad(mean loss) · [2]',
      });
      drawMatrix(ctx, api, [-2.5], 1100, 405, {
        cw: 160,
        ch: 100,
        color: themeColors.pink,
        label: 'scalar bias gradient',
      });
      drawText(ctx, api, 'Two examples, one weight', 960, 650, 35, themeColors.yellow);
      drawLine(ctx, api, 480, 800, 1440, 800, themeColors.muted, 3);
      drawLine(ctx, api, 960, 780, 960, 820, themeColors.muted, 3);
      for (const [cue, direction, color] of [
        ['transform-left', -1, themeColors.blue],
        ['transform-right', 1, themeColors.cyan],
      ]) {
        const progress = operationProgress(state, cue);
        if (progress > 0.08)
          api.arrow(ctx, 960, 800, 960 + direction * 300 * progress, 800, color, 9);
        if (resultAfter(state, cue))
          drawText(ctx, api, direction < 0 ? '−2' : '+2', 960 + direction * 300, 750, 38, color);
      }
      if (resultAfter(state, 'transform-cancel'))
        drawText(ctx, api, 'mean gradient = 0', 600, 935, 33, themeColors.green);
      if (resultAfter(state, 'transform-norm'))
        drawText(ctx, api, 'mean individual norms = 2', 1360, 935, 33, themeColors.yellow);
    }
  };
  mark(ctx, api, 'jx-transform-order-mechanism', paint);
}
export default {
  id: 'transform-order',
  draw: drawTransformOrder,
  cues: [
    'jx-transform-order-b0',
    'transform-scalar',
    'jx-transform-order-b1',
    'transform-mapped-shape',
    'transform-aggregate',
    'transform-left',
    'transform-right',
    'transform-cancel',
    'transform-norm',
  ],
};
