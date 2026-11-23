import { P } from '../fixtures.mjs';
import { directionFrame } from '../model.mjs';
import {
  drawEquation,
  drawMatrix,
  drawRow,
  drawTarget,
  drawText,
  formatNumber,
  outputArrow,
  outputAxes,
  outputPlaneCoordinates,
} from '../defaults.mjs';
export function drawDirections(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = directionFrame(state);
    drawText(
      ctx,
      api,
      'P · two input rows, three output columns',
      540,
      305,
      31,
      themeColors.yellow,
      'center',
    );
    drawTarget(ctx, api, 'map-matrix', () =>
      drawMatrix(ctx, api, P, 330, 405, themeColors.yellow, 140),
    );
    [1, 2].forEach((i, r) =>
      drawEquation(
        ctx,
        api,
        'e_' + i + 'P',
        235,
        475 + r * 140,
        35,
        r ? themeColors.pink : themeColors.blue,
      ),
    );
    [1, 2, 3].forEach((i, c) =>
      drawEquation(ctx, api, 'y_' + i, 400 + c * 140, 370, 33, themeColors.cyan),
    );
    const axes = drawTarget(ctx, api, 'map-axes', () => outputAxes(ctx, api));
    drawTarget(ctx, api, 'first-map-direction', () =>
      outputArrow(ctx, api, axes, [0, 0], outputPlaneCoordinates(f.rows[0]), themeColors.blue),
    );
    drawTarget(ctx, api, 'second-map-direction', () =>
      outputArrow(ctx, api, axes, [0, 0], outputPlaneCoordinates(f.rows[1]), themeColors.pink),
    );
    const active = beat === 2 ? 1 : 0,
      id = active ? 'second-full-direction' : 'first-full-direction';
    drawTarget(ctx, api, id, () => {
      const input = active ? [0, f.second] : [f.first, 0];
      drawText(
        ctx,
        api,
        'input [' + input.map(formatNumber).join(', ') + '] → full output',
        1350,
        905,
        28,
        active ? themeColors.pink : themeColors.blue,
        'center',
      );
      drawRow(
        ctx,
        api,
        f.rows[active],
        1185,
        930,
        active ? themeColors.pink : themeColors.blue,
        110,
      );
    });
    drawText(ctx, api, 'shape: input @ map → output', 530, 785, 27, themeColors.muted, 'center');
    drawEquation(ctx, api, '[2]\\;@\\;[2,3]\\longrightarrow[3]', 530, 845, 43, themeColors.ink);
    drawText(ctx, api, 'Plot: outputs 1 and 3', 1360, 275, 29, themeColors.muted, 'center');
  }
}
export default {
  id: 'directions',
  draw: drawDirections,
  cues: ['map-shape', 'first-direction', 'second-direction'],
};
