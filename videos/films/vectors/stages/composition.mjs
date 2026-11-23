import { H, P, R } from '../fixtures.mjs';
import { COMPOSED, add, compositionFrame, done } from '../model.mjs';
import {
  drawEquation,
  drawMatrix,
  drawRow,
  drawTarget,
  drawText,
  formatNumber,
  outputArrow,
  outputAxes,
} from '../defaults.mjs';
export function drawComposition(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = compositionFrame(state);
    if (beat === 1) {
      drawText(ctx, api, 'first map P', 445, 300, 32, themeColors.yellow, 'center');
      drawMatrix(ctx, api, P, 270, 390, themeColors.yellow, 115);
      drawText(ctx, api, 'second map R', 960, 300, 32, themeColors.cyan, 'center');
      drawMatrix(ctx, api, R, 845, 390, themeColors.cyan, 115);
      drawText(ctx, api, 'combined map C', 1500, 300, 32, themeColors.green, 'center');
      drawTarget(ctx, api, 'composed-matrix', () =>
        drawMatrix(
          ctx,
          api,
          COMPOSED,
          1385,
          390,
          themeColors.green,
          115,
          (r, c) => r * 2 + c < f.count,
        ),
      );
      drawText(ctx, api, '×', 700, 520, 55);
      drawText(ctx, api, '=', 1240, 520, 55);
      drawTarget(ctx, api, 'composition-contract', () =>
        drawEquation(
          ctx,
          api,
          '[2,3]\\;@\\;[3,2]\\longrightarrow[2,2]',
          960,
          850,
          48,
          themeColors.ink,
        ),
      );
      if (f.count > 0)
        drawEquation(
          ctx,
          api,
          'C_{1,1}=1\\cdot1+0\\cdot0+0.5\\cdot1=1.5',
          960,
          970,
          41,
          themeColors.green,
        );
    } else {
      const axes = outputAxes(
        ctx,
        api,
        1070,
        360,
        650,
        400,
        'first final coordinate',
        'second final coordinate',
        1.6,
      );
      if (beat === 0) {
        drawText(
          ctx,
          api,
          'password · intermediate row',
          480,
          290,
          32,
          themeColors.yellow,
          'center',
        );
        drawRow(ctx, api, f.intermediate, 285, 340, themeColors.yellow, 130);
        drawText(ctx, api, 'downstream map R', 480, 570, 31, themeColors.cyan, 'center');
        drawMatrix(ctx, api, R, 350, 625, themeColors.cyan, 110);
        let previous = [0, 0];
        drawTarget(ctx, api, 'downstream-construction', () =>
          f.pieces.forEach((piece, i) => {
            const next = add(previous, piece);
            outputArrow(
              ctx,
              api,
              axes,
              previous,
              next,
              [themeColors.blue, themeColors.pink, themeColors.cyan][i],
            );
            previous = next;
          }),
        );
        drawTarget(ctx, api, 'downstream-result', () =>
          drawEquation(
            ctx,
            api,
            (f.amounts.every(done) ? 'z' : '\\text{partial sum}') +
              '=[' +
              f.sum.map(formatNumber).join(',') +
              ']',
            1370,
            930,
            43,
            themeColors.green,
          ),
        );
      } else {
        drawText(ctx, api, 'password · direct input', 480, 290, 32, themeColors.yellow, 'center');
        drawRow(ctx, api, H[0][2], 350, 340, themeColors.yellow, 130);
        drawText(ctx, api, 'combined map C = P R', 480, 575, 31, themeColors.green, 'center');
        drawMatrix(ctx, api, COMPOSED, 350, 640, themeColors.green, 130);
        const reference = axes.point(...f.result);
        api.circle(ctx, reference.x, reference.y, 19, 'transparent', themeColors.muted, 3);
        let previous = [0, 0];
        drawTarget(ctx, api, 'direct-construction', () =>
          f.directPieces.forEach((piece, i) => {
            const next = add(previous, piece);
            outputArrow(ctx, api, axes, previous, next, i ? themeColors.pink : themeColors.blue);
            previous = next;
          }),
        );
        drawTarget(ctx, api, 'direct-result', () =>
          drawEquation(
            ctx,
            api,
            (f.directComplete ? 'z' : '\\text{partial sum}') +
              '=[' +
              f.directSum.map(formatNumber).join(',') +
              ']',
            1370,
            930,
            43,
            themeColors.green,
          ),
        );
        drawText(
          ctx,
          api,
          f.directComplete
            ? 'both routes reach the same point'
            : 'gray point: completed two-stage route',
          1370,
          285,
          28,
          f.directComplete ? themeColors.green : themeColors.muted,
          'center',
        );
      }
    }
  }
}
export default {
  id: 'composition',
  draw: drawComposition,
  cues: [
    'downstream-first',
    'downstream-second',
    'downstream-third',
    'compose-matrices',
    'direct-first',
    'direct-second',
  ],
};
