import { REQUEST_W, REQUEST_X } from '../fixtures.mjs';
import { extendedFrame } from '../model.mjs';
import {
  drawDuration,
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
} from '../defaults.mjs';
export function drawManyOutputs(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('many-outputs', state);
  drawExtendedTarget(ctx, api, 'many-outputs' + '-mechanism', () => {
    drawExtendedTarget(ctx, api, 'two-output-inputs', () =>
      drawMatrixBlock(ctx, api, REQUEST_X, 300, 390, {
        label: 'X · request features',
        rowNames: ['A', 'B', 'C'],
        columnNames: ['prompt', 'queue'],
        cell: 115,
        color: themeColors.blue,
        select: (r) => r === 1,
      }),
    );
    drawExtendedTarget(ctx, api, 'two-output-weights', () =>
      drawMatrixBlock(ctx, api, REQUEST_W, 820, 445, {
        label: 'W · one column per output',
        rowNames: ['prompt', 'queue'],
        columnNames: ['seconds', 'priority'],
        cell: 115,
        color: themeColors.yellow,
      }),
    );
    drawExtendedText(ctx, api, '×', 650, 565, 56, themeColors.muted);
    drawExtendedText(ctx, api, '=', 1160, 565, 56, themeColors.muted);
    drawExtendedTarget(ctx, api, 'two-output-result', () =>
      drawMatrixBlock(ctx, api, f.values, 1350, 390, {
        label: 'Y · owned outputs',
        rowNames: ['A', 'B', 'C'],
        columnNames: ['seconds', 'priority'],
        cell: 115,
        color: themeColors.green,
        visible: (r, c) =>
          r * 2 + c < Math.floor(f.all * 6 + 1e-9) || (r === 1 && (c === 0 ? f.time : f.priority)),
      }),
    );
    if (beat === 1)
      drawExtendedTarget(ctx, api, 'priority-contributions', () =>
        drawDuration(
          ctx,
          api,
          440,
          835,
          [0.4 * f.first, 1.5 * f.second],
          ['2 × 0.2', '1 × 1.5'],
          [themeColors.blue, themeColors.pink],
          1040,
          2,
        ),
      );
    else
      drawExtendedTarget(ctx, api, 'two-output-shape', () =>
        drawExtendedEquation(
          ctx,
          api,
          '[3,2]@[2,2]\\longrightarrow[3,2]',
          960,
          920,
          48,
          themeColors.ink,
        ),
      );
    drawFooter(
      ctx,
      api,
      'Priority is a supplied score · seconds and priority retain different units',
    );
  });
}
export default {
  id: 'many-outputs',
  draw: drawManyOutputs,
  cues: [
    'request-b-time',
    'priority-first',
    'priority-second',
    'request-b-priority',
    'request-all-outputs',
  ],
};
