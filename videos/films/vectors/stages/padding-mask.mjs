import { extendedFrame } from '../model.mjs';
import {
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
  drawResult,
  formatExtendedNumber,
} from '../defaults.mjs';
export function drawPaddingMask(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('padding-mask', state);
  drawExtendedTarget(ctx, api, 'padding-mask' + '-mechanism', () => {
    const empty = beat === 2,
      tokens = empty
        ? [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
          ]
        : f.padded === 1
          ? [
              [1, 0],
              [0, 1],
              [0, 0],
              [0, 0],
            ]
          : [
              [1, 0],
              [0, 1],
            ],
      rowY = 365;
    drawExtendedTarget(ctx, api, 'padding-input', () =>
      drawMatrixBlock(ctx, api, tokens, 330, 365, {
        label: empty
          ? 'new all-padding premise'
          : f.padded === 1
            ? 'two real tokens, two padding rows'
            : 'two real tokens',
        rowNames: empty
          ? ['PAD', 'PAD', 'PAD', 'PAD']
          : ['T0', 'T1', 'PAD', 'PAD'].slice(0, tokens.length),
        cell: 105,
        color: themeColors.blue,
        select: (r) => !empty && f.masked && r < 2,
      }),
    );
    drawExtendedTarget(ctx, api, 'padding-validity', () =>
      drawMatrixBlock(
        ctx,
        api,
        f.valid.slice(0, tokens.length).map((v) => [v ? 'true' : 'false']),
        840,
        365,
        {
          label: 'boolean validity',
          cell: 105,
          fontSize: 26,
          color: themeColors.yellow,
        },
      ),
    );
    if (empty) {
      drawExtendedTarget(ctx, api, 'padding-empty', () => {
        drawExtendedText(
          ctx,
          api,
          'all-padding request',
          1400,
          470,
          35,
          themeColors.yellow,
          'center',
        );
        drawExtendedText(ctx, api, 'valid count = 0', 1400, 615, 44, themeColors.pink, 'center');
        drawExtendedText(
          ctx,
          api,
          f.failure ? 'reject before division' : 'inspect the denominator',
          1400,
          790,
          35,
          f.failure ? themeColors.pink : themeColors.muted,
          'center',
        );
      });
    } else {
      const meanColor = f.masked || f.padded < 1 ? themeColors.green : themeColors.pink;
      drawExtendedText(ctx, api, 'sum', 1245, 365, 30, themeColors.muted, 'center');
      drawMatrixBlock(ctx, api, [[1, 1]], 1145, 425, {
        cell: 105,
        color: themeColors.ink,
      });
      drawExtendedTarget(ctx, api, 'padding-divisor', () => {
        drawExtendedText(ctx, api, 'divide by', 1245, 640, 31, themeColors.muted, 'center');
        drawResult(
          ctx,
          api,
          f.masked ? '2 real tokens' : f.padded === 1 ? '4 stored positions' : '2 real tokens',
          1245,
          730,
          true,
          meanColor,
          35,
        );
      });
      drawExtendedTarget(ctx, api, 'padding-mean', () =>
        drawResult(
          ctx,
          api,
          '[' + (f.masked ? f.correct : f.plain).map(formatExtendedNumber).join(', ') + ']',
          1245,
          890,
          true,
          meanColor,
          49,
        ),
      );
    }
    drawFooter(
      ctx,
      api,
      'One validity bit controls every feature in its token · keep the real-token denominator',
    );
  });
}
export default {
  id: 'padding-mask',
  draw: drawPaddingMask,
  cues: ['padding-add', 'padding-select', 'padding-empty'],
};
