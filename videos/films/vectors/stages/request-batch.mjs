import { REQUEST_X } from '../fixtures.mjs';
import { extendedFrame } from '../model.mjs';
import {
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
} from '../defaults.mjs';
export function drawRequestBatch(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('request-batch', state);
  drawExtendedTarget(ctx, api, 'request-batch' + '-mechanism', () => {
    drawExtendedTarget(ctx, api, 'request-inputs', () =>
      drawMatrixBlock(ctx, api, REQUEST_X, 340, 395, {
        label: 'three owned requests',
        rowNames: ['A', 'B', 'C'],
        columnNames: ['prompt', 'queue'],
        cell: 125,
        color: themeColors.blue,
      }),
    );
    drawExtendedTarget(ctx, api, 'request-shared-rule', () =>
      drawMatrixBlock(ctx, api, [[2], [1]], 900, 450, {
        label: 'shared rule L1',
        cell: 120,
        color: themeColors.yellow,
      }),
    );
    drawExtendedText(ctx, api, '×', 735, 590, 60, themeColors.muted);
    drawExtendedText(ctx, api, '=', 1150, 590, 58, themeColors.muted);
    drawExtendedTarget(ctx, api, 'request-predictions', () =>
      drawMatrixBlock(
        ctx,
        api,
        f.values.map((v) => [v]),
        1330,
        395,
        {
          label: 'seconds per request',
          rowNames: ['A', 'B', 'C'],
          visible: (r) => f.visible[r],
          cell: 125,
          color: themeColors.green,
        },
      ),
    );
    drawExtendedTarget(ctx, api, 'request-shape', () => {
      drawExtendedEquation(
        ctx,
        api,
        '[3,2]@[2]\\longrightarrow[3]',
        960,
        beat === 2 ? 860 : 940,
        47,
        themeColors.ink,
      );
      if (beat === 2 && f.column === 1)
        drawExtendedEquation(
          ctx,
          api,
          '[3,2]@[2,1]\\longrightarrow[3,1]',
          960,
          945,
          40,
          themeColors.green,
        );
    });
    drawFooter(
      ctx,
      api,
      beat === 2
        ? 'A singleton column axis is different from a one-dimensional vector'
        : 'Contract features · keep each request row',
    );
  });
}
export default {
  id: 'request-batch',
  draw: drawRequestBatch,
  cues: ['request-a', 'request-b', 'request-c', 'request-column'],
};
