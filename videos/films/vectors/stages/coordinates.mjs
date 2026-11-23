import { H } from '../fixtures.mjs';
import { coordinateFrame } from '../model.mjs';
import {
  drawCaption,
  drawEquation,
  drawRow,
  drawTarget,
  drawText,
  formatNumber,
  outputArrow,
  outputAxes,
} from '../defaults.mjs';
export function drawCoordinates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = coordinateFrame(state),
      axes = outputAxes(ctx, api, 220, 325, 720, 535, 'first coordinate', 'second coordinate');
    drawTarget(ctx, api, 'horizontal-component', () =>
      outputArrow(ctx, api, axes, [0, 0], [0.5 * f.first, 0], themeColors.blue),
    );
    drawTarget(ctx, api, 'vertical-component', () =>
      outputArrow(ctx, api, axes, [0.5, 0], [0.5, 0.5 * f.second], themeColors.pink),
    );
    drawTarget(ctx, api, 'password-vector', () => {
      if (f.second > 0) outputArrow(ctx, api, axes, [0, 0], f.point, themeColors.cyan, 4);
    });
    drawText(
      ctx,
      api,
      'password',
      axes.point(0.5, 0.5).x + 25,
      axes.point(0.5, 0.5).y - 25,
      30,
      themeColors.cyan,
    );
    drawTarget(ctx, api, 'coordinate-row', () => {
      drawText(ctx, api, 'two scalar coordinates', 1390, 390, 32, themeColors.muted, 'center');
      drawRow(ctx, api, H[0][2], 1240, 440, themeColors.cyan, 150);
      drawEquation(ctx, api, 'x=[x_1,x_2]', 1390, 670, 46, themeColors.cyan);
    });
    if (beat === 2)
      drawTarget(ctx, api, 'swap-points', () => {
        const start = axes.point(1, 0);
        api.circle(ctx, start.x, start.y, 10, themeColors.muted);
        outputArrow(ctx, api, axes, [0, 0], f.swapPoint, themeColors.yellow, 6);
        drawText(
          ctx,
          api,
          'reset · swapping positions',
          1390,
          800,
          30,
          themeColors.yellow,
          'center',
        );
        drawEquation(
          ctx,
          api,
          '[' + formatNumber(f.swapPoint[0]) + ',' + formatNumber(f.swapPoint[1]) + ']',
          1390,
          890,
          48,
          themeColors.yellow,
        );
      });
    else drawEquation(ctx, api, 'x_1e_1+x_2e_2=x', 1390, 850, 43, themeColors.ink);
    drawCaption(ctx, api, 'Equal axis units · coordinate meaning stays with its position');
  }
}
export default {
  id: 'coordinates',
  draw: drawCoordinates,
  cues: ['first-coordinate', 'second-coordinate', 'swap-coordinates'],
};
