import { mixtureFrame } from '../model.mjs';
import {
  drawRow,
  drawTarget,
  drawText,
  formatNumber,
  outputArrow,
  outputAxes,
  outputPlaneCoordinates,
} from '../defaults.mjs';
export function drawMixture(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = mixtureFrame(state),
      axes = outputAxes(ctx, api);
    drawText(ctx, api, 'password · x = [0.5, 0.5]', 540, 295, 34, themeColors.yellow, 'center');
    drawTarget(ctx, api, 'first-weighted-row', () => {
      drawText(
        ctx,
        api,
        'first direction × ' + formatNumber(f.first),
        530,
        390,
        32,
        themeColors.blue,
        'center',
      );
      drawRow(ctx, api, f.rows[0], 320, 425, themeColors.blue, 140);
    });
    drawTarget(ctx, api, 'second-weighted-row', () => {
      drawText(
        ctx,
        api,
        'second direction × ' + formatNumber(f.second),
        530,
        625,
        32,
        themeColors.pink,
        'center',
      );
      drawRow(ctx, api, f.rows[1], 320, 660, themeColors.pink, 140);
    });
    drawTarget(ctx, api, 'first-contribution', () =>
      outputArrow(ctx, api, axes, [0, 0], outputPlaneCoordinates(f.rows[0]), themeColors.blue),
    );
    drawTarget(ctx, api, 'second-contribution', () =>
      outputArrow(
        ctx,
        api,
        axes,
        outputPlaneCoordinates(f.secondOrigin),
        outputPlaneCoordinates(f.secondTip),
        themeColors.pink,
      ),
    );
    drawText(ctx, api, 'Plot: outputs 1 and 3', 1360, 275, 29, themeColors.muted, 'center');
    drawTarget(ctx, api, 'mixture-result', () => {
      drawText(
        ctx,
        api,
        f.result
          ? 'password · complete output'
          : beat < 2
            ? 'scale the two whole directions'
            : 'where will the sum land?',
        960,
        870,
        32,
        f.result ? themeColors.green : themeColors.muted,
        'center',
      );
      drawRow(
        ctx,
        api,
        f.result ?? [0.5, 0.5, 0.5],
        735,
        910,
        f.result ? themeColors.green : themeColors.muted,
        150,
        () => Boolean(f.result),
      );
    });
  }
}
export default {
  id: 'mixture',
  draw: drawMixture,
  cues: ['scale-first', 'scale-second', 'join-vectors'],
};
