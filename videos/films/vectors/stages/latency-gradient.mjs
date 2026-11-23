import { REQUEST_X } from '../fixtures.mjs';
import { extendedFrame } from '../model.mjs';
import {
  coordinateArrow,
  coordinateAxes,
  coordinateDot,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
  drawResult,
  formatExtendedNumber,
} from '../defaults.mjs';
export function drawLatencyGradient(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('latency-gradient', state);
  drawExtendedTarget(ctx, api, 'latency-gradient' + '-mechanism', () => {
    if (beat < 2) {
      drawExtendedText(
        ctx,
        api,
        'learning example · parameter coordinates',
        960,
        280,
        34,
        themeColors.yellow,
        'center',
      );
      const p = drawExtendedTarget(ctx, api, 'gradient-plane', () =>
        coordinateAxes(
          ctx,
          api,
          230,
          395,
          560,
          440,
          [0, 2.6],
          [0, 2.6],
          'prompt weight',
          'queue weight',
          [0, 1, 2],
        ),
      );
      coordinateDot(ctx, api, p, [2, 2], themeColors.muted, 9);
      coordinateArrow(ctx, api, p, [2, 2], f.weights, themeColors.green, 7);
      drawExtendedTarget(ctx, api, 'gradient-input', () => {
        drawMatrixBlock(ctx, api, [[2, 2]], 1050, 390, {
          label: 'starting weights',
          color: themeColors.yellow,
          cell: 140,
        });
        drawMatrixBlock(ctx, api, [[4, 2]], 1050, 630, {
          label: 'gradient · one loss slope per weight',
          color: themeColors.pink,
          cell: 140,
        });
      });
      drawExtendedTarget(ctx, api, 'gradient-scaled', () =>
        drawExtendedText(
          ctx,
          api,
          (f.learning === 1 ? '0.1 × gradient = [' : 'scaled change building: [') +
            f.change.map(formatExtendedNumber).join(', ') +
            ']',
          1250,
          830,
          35,
          themeColors.pink,
          'center',
        ),
      );
      drawExtendedTarget(ctx, api, 'gradient-result', () =>
        drawResult(
          ctx,
          api,
          'updated [' + f.weights.map(formatExtendedNumber).join(', ') + ']',
          1250,
          940,
          f.settled,
          themeColors.green,
          40,
        ),
      );
    } else {
      const objects = [
        {
          name: 'scalar loss',
          shape: '()',
          values: [[1]],
          rank: 0,
        },
        {
          name: 'feature vector',
          shape: '(2,)',
          values: [[2, 1]],
          rank: 1,
        },
        {
          name: 'request matrix',
          shape: '(3, 2)',
          values: REQUEST_X,
          rank: 2,
        },
      ];
      objects.forEach((o, i) => {
        const x = 230 + i * 570;
        drawExtendedText(
          ctx,
          api,
          o.name,
          x + 170,
          330,
          32,
          [themeColors.green, themeColors.blue, themeColors.cyan][i],
          'center',
        );
        if (i === 0)
          drawExtendedText(ctx, api, '1.0', x + 170, 550, 72, themeColors.green, 'center');
        else
          drawMatrixBlock(ctx, api, o.values, x + 45, 425, {
            cell: 115,
          });
        drawExtendedText(ctx, api, o.shape, x + 170, 845, 39, themeColors.ink, 'center');
        drawExtendedText(
          ctx,
          api,
          o.rank + (o.rank === 1 ? ' axis' : ' axes'),
          x + 170,
          920,
          31,
          themeColors.muted,
          'center',
        );
      });
    }
    drawFooter(
      ctx,
      api,
      'Same length can describe different quantities · preserve feature names and units',
    );
  });
}
export default {
  id: 'latency-gradient',
  draw: drawLatencyGradient,
  cues: ['gradient-scale', 'gradient-update', 'gradient-result'],
};
