import { REQUEST_W, REQUEST_X } from '../fixtures.mjs';
import { extendedFrame } from '../model.mjs';
import {
  coordinateArrow,
  coordinateAxes,
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
} from '../defaults.mjs';
export function drawShapeGuard(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('shape-guard', state);
  drawExtendedTarget(ctx, api, 'shape-guard' + '-mechanism', () => {
    if (beat < 2) {
      drawExtendedTarget(ctx, api, 'shape-input', () =>
        drawMatrixBlock(ctx, api, REQUEST_X, 350, 410, {
          label: 'requests × input features',
          cell: 115,
          color: themeColors.blue,
        }),
      );
      drawExtendedTarget(ctx, api, 'shape-map', () =>
        drawMatrixBlock(
          ctx,
          api,
          f.repaired
            ? REQUEST_W
            : [
                [2, 0.2],
                [1, 1.5],
                [1, 0],
              ],
          1130,
          410,
          {
            label: f.repaired ? 'two defined input features' : 'expects a third input feature',
            cell: 115,
            color: f.repaired ? themeColors.yellow : themeColors.pink,
          },
        ),
      );
      drawExtendedText(ctx, api, '×', 880, 595, 65, themeColors.muted);
      drawExtendedTarget(ctx, api, 'shape-contract', () =>
        drawExtendedEquation(
          ctx,
          api,
          f.repaired ? '[3,2]@[2,2]\\longrightarrow[3,2]' : '[3,2]@[3,2]',
          960,
          895,
          55,
          f.repaired ? themeColors.green : themeColors.pink,
        ),
      );
      drawExtendedText(
        ctx,
        api,
        f.repaired
          ? 'restore the operator that consumes these named inputs'
          : 'third coefficient: no matching measurement',
        960,
        975,
        32,
        f.repaired ? themeColors.green : themeColors.pink,
        'center',
      );
    } else {
      drawMatrixBlock(
        ctx,
        api,
        [
          [1, 2],
          [2, 4],
        ],
        340,
        440,
        {
          cell: 120,
          label: 'a matrix with repeated direction',
          color: themeColors.blue,
        },
      );
      const p = coordinateAxes(
        ctx,
        api,
        1080,
        425,
        500,
        360,
        [0, 4.8],
        [0, 4.8],
        'first coordinate',
        'second coordinate',
        [0, 2, 4],
      );
      coordinateArrow(ctx, api, p, [0, 0], [2 * f.rank, 4 * f.rank], themeColors.muted, 5);
      coordinateArrow(ctx, api, p, [0, 0], [1, 2], themeColors.cyan, 8);
      drawExtendedText(ctx, api, 'array rank = 2 axes', 500, 825, 35, themeColors.ink, 'center');
      drawExtendedText(
        ctx,
        api,
        'matrix rank = 1 independent direction',
        960,
        940,
        38,
        themeColors.green,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Matching size establishes structure · named coordinates establish meaning',
    );
  });
}
export default {
  id: 'shape-guard',
  draw: drawShapeGuard,
  cues: ['shape-repair', 'shape-rank'],
};
