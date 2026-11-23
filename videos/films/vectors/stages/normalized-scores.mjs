import { event, extendedFrame, scale } from '../model.mjs';
import {
  coordinateArrow,
  coordinateAxes,
  coordinateDot,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawLine,
  drawResult,
  formatExtendedNumber,
} from '../defaults.mjs';
import { lerpArray } from 'vizmatic';
export function drawNormalizedScores(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('normalized-scores', state);
  drawExtendedTarget(ctx, api, 'normalized-scores' + '-mechanism', () => {
    if (beat === 2) {
      const examples = [
        {
          name: 'perpendicular',
          v: [0, 1],
          answer: 'cosine 0',
          id: 'cosine-perpendicular',
          color: themeColors.blue,
        },
        {
          name: 'opposite',
          v: [-1, 0],
          answer: 'cosine −1',
          id: 'cosine-opposite',
          color: themeColors.pink,
        },
        {
          name: 'zero vector',
          v: [0, 0],
          answer: 'direction undefined',
          id: 'zero-direction',
          color: themeColors.muted,
        },
      ];
      examples.forEach((e, i) => {
        const x = 155 + i * 570,
          progress = event(state, e.id, 2);
        drawExtendedText(ctx, api, e.name, x + 230, 320, 35, e.color, 'center');
        const p = coordinateAxes(
          ctx,
          api,
          x,
          445,
          450,
          360,
          [-1.25, 1.25],
          [-1.25, 1.25],
          'first coordinate',
          'second coordinate',
          [-1, 0, 1],
        );
        drawExtendedTarget(ctx, api, e.id, () => {
          coordinateArrow(ctx, api, p, [0, 0], [1, 0], themeColors.muted, 3);
          if (i === 2) coordinateDot(ctx, api, p, [0, 0], themeColors.muted, 8);
          else coordinateArrow(ctx, api, p, [0, 0], scale(e.v, progress), e.color, 7);
          drawResult(ctx, api, e.answer, x + 225, 925, progress === 1, e.color, 34);
        });
      });
      drawFooter(ctx, api, 'Cosine divides by both lengths · zero has no direction');
      return;
    }
    const left = coordinateAxes(
      ctx,
      api,
      230,
      405,
      570,
      360,
      [-0.1, 1.4],
      [-0.1, 1.4],
      'first coordinate',
      'second coordinate',
      [0, 0.5, 1],
    );
    const right = coordinateAxes(
      ctx,
      api,
      1115,
      405,
      570,
      360,
      [-0.1, 1.4],
      [-0.1, 1.4],
      'first coordinate',
      'second coordinate',
      [0, 0.5, 1],
    );
    drawExtendedText(
      ctx,
      api,
      'original direction · a = [0.5, 0.5]',
      510,
      295,
      31,
      themeColors.blue,
      'center',
    );
    drawExtendedText(
      ctx,
      api,
      beat === 1 ? 'normalize the scaled copy' : 'scale a copy on the same ray',
      1390,
      295,
      31,
      themeColors.yellow,
      'center',
    );
    drawExtendedTarget(ctx, api, 'length-original', () => {
      coordinateArrow(ctx, api, left, [0, 0], [0.5, 0.5], themeColors.blue);
      coordinateArrow(ctx, api, left, [0, 0], [1, 0], themeColors.muted, 3);
      const p = left.point(0.5, 0.5),
        z = left.point(0.5, 0);
      drawLine(ctx, api, [p.x, p.y], [z.x, z.y], themeColors.muted, 2);
      const start = left.point(0, 0);
      drawLine(ctx, api, [start.x, start.y + 13], [z.x, z.y + 13], themeColors.green, 7);
    });
    const displayed = beat === 1 ? lerpArray(f.vector, f.unit, f.normalize) : f.vector;
    drawExtendedTarget(ctx, api, 'length-scaled', () => {
      coordinateArrow(ctx, api, right, [0, 0], displayed, themeColors.yellow);
      coordinateArrow(ctx, api, right, [0, 0], [1, 0], themeColors.muted, 3);
      const p = right.point(...displayed),
        z = right.point(displayed[0], 0),
        start = right.point(0, 0);
      drawLine(ctx, api, [p.x, p.y], [z.x, z.y], themeColors.muted, 2);
      drawLine(ctx, api, [start.x, start.y + 13], [z.x, z.y + 13], themeColors.green, 7);
    });
    drawExtendedTarget(ctx, api, 'length-results', () => {
      drawExtendedText(ctx, api, 'raw dot = 0.5', 510, 915, 34, themeColors.green, 'center');
      drawExtendedText(
        ctx,
        api,
        'raw dot = ' + formatExtendedNumber(displayed[0]),
        1390,
        915,
        34,
        themeColors.green,
        'center',
      );
      drawExtendedText(ctx, api, 'cosine = 1/√2 ≈ 0.707', 510, 970, 31, themeColors.blue, 'center');
      drawExtendedText(
        ctx,
        api,
        'cosine = ' + formatExtendedNumber(displayed[0] / Math.hypot(...displayed)),
        1390,
        970,
        31,
        themeColors.yellow,
        'center',
      );
    });
    drawFooter(
      ctx,
      api,
      beat === 1
        ? 'After normalization, raw self-score is 1 for every nonzero vector'
        : 'Equal coordinate units · positive scaling changes length and preserves angle',
    );
  });
}
export default {
  id: 'normalized-scores',
  draw: drawNormalizedScores,
  cues: [
    'length-double',
    'unit-normalize',
    'cosine-perpendicular',
    'cosine-opposite',
    'zero-direction',
  ],
};
