import { H } from '../fixtures.mjs';
import { BASE_OUTPUT, localEditFrame } from '../model.mjs';
import {
  drawEquation,
  drawMatrix,
  drawOwnedMatrix,
  drawRow,
  drawTarget,
  drawText,
  outputArrow,
  outputAxes,
  outputMarker,
  outputPlaneCoordinates,
} from '../defaults.mjs';
export function drawLocalEdit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = localEditFrame(state);
    if (beat === 1) {
      const left = outputAxes(ctx, api, 230, 375, 620, 400, 'first input', 'second input', 1.8);
      const right = outputAxes(ctx, api, 1090, 375, 620, 400, 'first output', 'third output', 1.8);
      drawText(
        ctx,
        api,
        'password · edit one input coordinate',
        535,
        280,
        30,
        themeColors.yellow,
        'center',
      );
      drawText(
        ctx,
        api,
        'password · follow the actual map',
        1395,
        280,
        30,
        themeColors.green,
        'center',
      );
      outputMarker(ctx, api, left, H[0][2], themeColors.muted, 14);
      outputMarker(
        ctx,
        api,
        right,
        outputPlaneCoordinates(BASE_OUTPUT[0][2]),
        themeColors.muted,
        14,
      );
      drawTarget(ctx, api, 'local-input', () => {
        outputArrow(ctx, api, left, H[0][2], f.input, themeColors.yellow);
        drawRow(ctx, api, f.input, 375, 895, themeColors.yellow, 150);
      });
      drawTarget(ctx, api, 'local-output', () => {
        outputArrow(
          ctx,
          api,
          right,
          outputPlaneCoordinates(BASE_OUTPUT[0][2]),
          outputPlaneCoordinates(f.selected),
          themeColors.green,
        );
        drawMatrix(
          ctx,
          api,
          [f.selected],
          1170,
          895,
          themeColors.green,
          150,
          () => true,
          (_v, _r, c) => ({
            stroke: c === 1 ? themeColors.muted : themeColors.green,
            textColor: c === 1 ? themeColors.muted : themeColors.green,
          }),
        );
      });
    } else {
      drawTarget(ctx, api, 'batch-controls', () => {
        drawOwnedMatrix(ctx, api, 0, f.output[0], 455, 365, {
          id: 'local-a',
          selected: beat === 2,
          controls: beat === 2,
        });
        drawOwnedMatrix(ctx, api, 1, f.output[1], 1260, 365, {
          id: 'local-b',
          controls: beat === 2,
        });
      });
      drawTarget(ctx, api, 'local-question', () => {
        drawText(
          ctx,
          api,
          beat === 0
            ? 'Which output rows should move?'
            : 'one changed word state · five unchanged controls',
          960,
          835,
          35,
          beat === 0 ? themeColors.yellow : themeColors.green,
          'center',
        );
        if (beat === 0)
          drawEquation(
            ctx,
            api,
            'x_{\\mathrm{password}}:[0.5,0.5]\\longrightarrow[1.5,0.5]',
            960,
            935,
            44,
            themeColors.yellow,
          );
        else
          drawEquation(
            ctx,
            api,
            '[B,T,2]\\;@\\;[2,3]\\longrightarrow[B,T,3]',
            960,
            955,
            46,
            themeColors.ink,
          );
      });
    }
  }
}
export default {
  id: 'local-edit',
  draw: drawLocalEdit,
  cues: ['predict-local-edit', 'change-password', 'check-locality'],
};
