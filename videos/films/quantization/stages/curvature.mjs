import { CALIBRATION } from '../fixtures.mjs';
import { calibrationHessian } from '../arithmetic.mjs';
import { drawEquation, drawRectangle, drawText } from '../defaults.mjs';
export function drawCurvature(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0, end = 1) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(beatP, start, end);
  const fade = api.components.fade;
  ctx.save();
  (() => {
    const sampleP = api.focus.progress('calibration-samples', stage(0, 0.05, 0.75)),
      matrixP = api.focus.progress('build-curvature', stage(1, 0.04, 0.92));
    const contributed = Math.min(2, Math.floor(matrixP * 2 + 1e-9)),
      column = Math.min(1, Math.floor(matrixP * 2));
    const leftX = 330,
      top = 380,
      pitch = 200;
    drawText(ctx, api, 'TWO CALIBRATION INPUTS', 530, 285, 34, themeColors.muted, 'center');
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++)
        api.focus.target('calibration-inputs', () => {
          const value = CALIBRATION[r][c];
          drawRectangle(
            ctx,
            api,
            leftX + c * pitch,
            top + r * pitch,
            170,
            135,
            themeColors.panel,
            c === column && matrixP > 0 && matrixP < 1 ? themeColors.yellow : themeColors.blue,
            12,
          );
          fade(sampleP, () =>
            drawText(
              ctx,
              api,
              String(value),
              leftX + c * pitch + 85,
              top + r * pitch + 90,
              58,
              themeColors.ink,
              'center',
              'mono',
            ),
          );
        });
    drawEquation(ctx, api, 'x_1', leftX + 85, 850, 40, themeColors.blue, 'center');
    drawEquation(ctx, api, 'x_2', leftX + pitch + 85, 850, 40, themeColors.blue, 'center');
    api.focus.target('curvature-mathcal-l-wx-hat-w-x-f-2', () =>
      drawEquation(
        ctx,
        api,
        '\\mathcal{L}=\\|WX-\\hat{W}X\\|_F^2',
        960,
        1010,
        46,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.reveal('build-curvature', () => {
      drawText(ctx, api, 'ACCUMULATED RELATIONSHIPS', 1370, 285, 34, themeColors.muted, 'center');
      drawEquation(ctx, api, 'H=2XX^{\\top}', 1370, 350, 50, themeColors.ink, 'center');
      const matrix = calibrationHessian(contributed);
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 2; c++)
          api.focus.target(r === c ? 'hessian-diagonal' : 'hessian-off-diagonal', () =>
            api.focus.target('hessian-matrix', () => {
              const color = r === c ? themeColors.yellow : themeColors.cyan,
                x = 1170 + c * 200,
                y = 405 + r * 200;
              drawRectangle(ctx, api, x, y, 175, 155, themeColors.panel, color, 12);
              drawText(
                ctx,
                api,
                String(matrix[r][c]),
                x + 87.5,
                y + 102,
                58,
                color,
                'center',
                'mono',
              );
            }),
          );
      if (matrixP < 1) {
        const fraction = matrixP * 2 - Math.floor(matrixP * 2),
          x = api.lerp(775, 865, fraction);
        api.focus.target('hessian-contribution', () => {
          drawText(ctx, api, 'this input adds', 940, 380, 28, themeColors.yellow, 'center');
          const contribution = CALIBRATION.map((row) =>
            CALIBRATION.map((other) => 2 * row[column] * other[column]),
          );
          for (let r = 0; r < 2; r++)
            for (let c = 0; c < 2; c++) {
              drawRectangle(
                ctx,
                api,
                x + c * 120,
                445 + r * 120,
                105,
                95,
                themeColors.panel,
                themeColors.yellow,
                8,
              );
              drawText(
                ctx,
                api,
                String(contribution[r][c]),
                x + c * 120 + 52.5,
                445 + r * 120 + 63,
                36,
                themeColors.yellow,
                'center',
                'mono',
              );
            }
        });
      }
      drawText(ctx, api, 'energy', 1370, 865, 32, themeColors.yellow, 'center');
      drawText(ctx, api, 'shared movement', 1370, 920, 32, themeColors.cyan, 'center');
    });
    return;
  })();
  ctx.restore();
}
export default {
  id: 'curvature',
  draw: drawCurvature,
  cues: [
    'calibration-samples',
    'calibration-loss',
    'build-curvature',
    'channel-energy',
    'channel-relationships',
    'shared-correction',
    'calibrated-limit',
  ],
};
