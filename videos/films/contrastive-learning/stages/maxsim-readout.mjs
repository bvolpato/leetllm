import { formatValue, tokenMaxSim } from '../arithmetic.mjs';
import {
  drawCells,
  drawMatrix,
  drawNote,
  drawPill,
  drawRectangle,
  drawText,
} from '../defaults.mjs';
export function drawMaxsimReadout(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-maxsim-readout-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('maxsim-readout-mechanism', () => {
    if (currentBeat === 0) {
      const rows = [
          [0.12, 0.93, 0.08],
          [0.19, 0.07, 0.91],
        ],
        m = tokenMaxSim(rows),
        count = resultComplete('sum')
          ? 2
          : resultComplete('key')
            ? 2
            : resultComplete('api')
              ? 1
              : 0;
      drawText(ctx, api, 'Supplied original token table', 750, 315, 33, themeColors.blue);
      ['d1', 'd2', 'd3'].forEach((v, i) =>
        drawText(ctx, api, v, 550 + i * 200, 405, 31, themeColors.muted),
      );
      ['API', 'key'].forEach((v, i) =>
        drawText(ctx, api, v, 300, 540 + i * 155, 34, themeColors.blue),
      );
      drawMatrix(
        ctx,
        api,
        rows.map((row, i) => row.map((v) => (i < count ? v : ''))),
        450,
        470,
        200,
        155,
        (i, j) => resultComplete('sum') && j === m.winners[i],
      );
      if (resultComplete('sum'))
        drawText(ctx, api, '.93 + .91 = ' + formatValue(m.sum, 2), 750, 865, 44, themeColors.green);
      if (resultComplete('reuse')) {
        drawText(ctx, api, 'Authored reuse variant', 1460, 430, 29, themeColors.yellow);
        drawMatrix(
          ctx,
          api,
          [
            [0.12, 0.93, 0.08],
            [0.19, 0.92, 0.21],
          ],
          1220,
          500,
          170,
          110,
          (i, j) => j === 1,
        );
        drawText(ctx, api, 'Both rows select d2', 1460, 815, 29, themeColors.green);
        drawText(ctx, api, 'No one-to-one constraint', 1460, 910, 28, themeColors.yellow);
      }
      drawNote(
        ctx,
        api,
        'Each query row contributes one maximum · no one-to-one or ordered phrase assignment',
      );
    } else if (currentBeat === 1) {
      drawText(ctx, api, 'Raw coordinates at equal precision', 960, 300, 36, themeColors.blue);
      for (let i = 0; i < 100; i++)
        drawRectangle(
          ctx,
          api,
          290 + (i % 20) * 43,
          410 + Math.floor(i / 20) * 55,
          34,
          40,
          themeColors.cyan,
        );
      drawText(ctx, api, '100 × 128 = 12,800', 720, 790, 37, themeColors.cyan);
      drawRectangle(ctx, api, 1260, 410, 130, 290, themeColors.blue);
      drawText(ctx, api, '1 × 768', 1410, 790, 37, themeColors.blue);
      if (resultComplete('bytes'))
        drawText(ctx, api, 'Raw coordinate ratio = 16.667', 960, 930, 40, themeColors.yellow);
      drawNote(ctx, api, 'Token count,dimension and index overhead are separate storage inputs');
    } else {
      drawText(
        ctx,
        api,
        'Approximate reconstruction retains a declared code contract',
        960,
        310,
        34,
        themeColors.yellow,
      );
      drawPill(ctx, api, 'nearest centroid ID', 560, 500, 730, themeColors.blue);
      drawPill(ctx, api, '1/2-bit residual coordinates', 1390, 500, 790, themeColors.cyan);
      if (B('compress')) {
        drawCells(
          ctx,
          api,
          ['centroid', '+', 'residual', '≈ vector'],
          300,
          735,
          340,
          85,
          themeColors.green,
        );
      }
      drawNote(ctx, api, 'ColBERTv2 compressed index size is not the raw 16.7× worksheet');
    }
  });
}
export default {
  id: 'maxsim-readout',
  draw: drawMaxsimReadout,
  cues: [
    'cl-maxsim-readout-api',
    'cl-maxsim-readout-key',
    'cl-maxsim-readout-sum',
    'cl-maxsim-readout-reuse',
    'cl-maxsim-readout-bytes',
    'cl-maxsim-readout-compress',
  ],
};
