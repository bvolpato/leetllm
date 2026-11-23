import { REQUEST_Y, extendedFrame } from '../model.mjs';
import {
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
} from '../defaults.mjs';
export function drawBroadcasting(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('broadcasting', state);
  drawExtendedTarget(ctx, api, 'broadcasting' + '-mechanism', () => {
    drawExtendedTarget(ctx, api, 'bias-original', () =>
      drawMatrixBlock(ctx, api, REQUEST_Y, 280, 400, {
        label: 'owned outputs',
        columnNames: ['seconds', 'priority'],
        rowNames: ['A', 'B', 'C'],
        cell: 115,
      }),
    );
    const rowMode = beat === 1,
      values = rowMode ? f.wrong : f.correct;
    drawExtendedTarget(ctx, api, 'bias-values', () =>
      drawMatrixBlock(
        ctx,
        api,
        rowMode ? [[0.1 * f.row], [-0.1 * f.row], [0]] : [[0.1 * f.feature, -0.1 * f.feature]],
        rowMode ? 900 : 835,
        rowMode ? 400 : 505,
        {
          label: rowMode ? 'apply one offset per request' : 'apply one offset per feature',
          color: rowMode ? themeColors.pink : themeColors.yellow,
          cell: 115,
          fontSize: 30,
        },
      ),
    );
    drawExtendedText(ctx, api, '+', 685, 590, 58, themeColors.muted);
    drawExtendedText(ctx, api, '=', 1150, 590, 58, themeColors.muted);
    drawExtendedTarget(ctx, api, 'bias-result', () =>
      drawMatrixBlock(ctx, api, values, 1335, 400, {
        label: rowMode ? 'valid shape · wrong axis' : 'feature offsets shared by rows',
        rowNames: ['A', 'B', 'C'],
        columnNames: ['seconds', 'priority'],
        color: rowMode ? themeColors.pink : themeColors.green,
        cell: 115,
        select: (r) => r === 1,
      }),
    );
    drawExtendedTarget(ctx, api, 'bias-contract', () =>
      drawExtendedEquation(
        ctx,
        api,
        rowMode ? '[3,2]+[3,1]\\longrightarrow[3,2]' : '[3,2]+[2]\\longrightarrow[3,2]',
        960,
        920,
        46,
        rowMode ? themeColors.pink : themeColors.green,
      ),
    );
    drawFooter(
      ctx,
      api,
      'Equal result shapes can carry different adjustments · check the intended axis',
    );
  });
}
export default {
  id: 'broadcasting',
  draw: drawBroadcasting,
  cues: ['feature-bias', 'row-bias', 'broadcast-diagnosis'],
};
