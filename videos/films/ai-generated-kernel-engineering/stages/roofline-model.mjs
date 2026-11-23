import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawRooflineModel(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('roofline-model', state),
    colors = [
      themeColors.blue,
      themeColors.cyan,
      themeColors.pink,
      themeColors.green,
      themeColors.yellow,
    ];
  api.focus.target('roofline-model-construction', () => {
    const N = 4,
      H = 8,
      logical = 6 * N * H,
      unique = 2 * (2 * N * H + H);
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'Attach the work proxy to one weighted feature',
        'Square + reduction contribution + normalize + weight',
      );
      const names = ['x²', 'sum contribution', 'x × inverse RMS', '× feature weight'];
      names.forEach((name, i) => {
        const x = 230 + i * 390;
        drawRow(
          ctx,
          api,
          [name],
          x,
          490,
          345,
          i < Math.ceil(progress * 4) ? colors[i] : themeColors.muted,
        );
      });
      drawChapterText(
        ctx,
        api,
        '~4 operations / feature + constant row work',
        960,
        790,
        36,
        themeColors.yellow,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Scalar instruction ceiling · a matrix Tensor Core peak does not describe this operator',
      );
    } else if (currentBeat === 1) {
      drawTitle(
        ctx,
        api,
        'Count logical streams and unique payload separately',
        'Explicit toy dimensions N=4 rows,H=8,float16 at2 bytes',
      );
      const w = 96,
        drawGrid = (x, y, rows, cols, c) => {
          for (let r = 0; r < rows; r++)
            for (let k = 0; k < cols; k++) api.rect(ctx, x + k * w, y + r * 48, w - 8, 38, c);
        };
      drawGrid(280, 430, N, H, themeColors.blue);
      drawGrid(280, 700, N, H, themeColors.green);
      for (let k = 0; k < H; k++) api.rect(ctx, 1180 + k * 72, 430, 64, 38, themeColors.yellow);
      drawChapterText(ctx, api, 'input + output', 660, 380, 31, themeColors.cyan, 'center');
      drawChapterText(
        ctx,
        api,
        'one shared weight row',
        1420,
        380,
        29,
        themeColors.yellow,
        'center',
      );
      if (at('logical', 1))
        drawChapterText(
          ctx,
          api,
          'logical:6×4×8 = ' + logical + ' B',
          1420,
          720,
          30,
          themeColors.blue,
          'center',
        );
      if (at('unique', 1))
        drawChapterText(
          ctx,
          api,
          'unique:2×(2×4×8+8) = ' + unique + ' B',
          1420,
          830,
          29,
          themeColors.green,
          'center',
        );
      drawNote(
        ctx,
        api,
        'Per-row weight reads are logical operations · a common stored weight need not be fetched anew each row',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'Which ceiling limits this kernel?',
        'Example bandwidth   900 GB/s     ·     Work per byte served   ⅔ operation',
      );
      const bw = 900,
        oi = 2 / 3,
        ceil = 500,
        bandwidth = bw * oi;
      api.line(ctx, 330, 800, 1600, 800, themeColors.muted, 3);
      api.rect(ctx, 330, 660, bandwidth * 1.7, 70, themeColors.blue);
      api.rect(ctx, 330, 480, ceil * 1.7, 70, themeColors.green);
      drawChapterText(ctx, api, 'Bandwidth ceiling   ' + bandwidth + ' GOP/s', 360, 625, 35, themeColors.blue);
      drawChapterText(ctx, api, 'Scalar compute ceiling   ' + ceil + ' GOP/s', 360, 445, 35, themeColors.green);
      if (at('roof', 2))
        drawChapterText(
          ctx,
          api,
          'Lower ceiling   ' + Math.min(bandwidth, ceil) + ' GOP/s',
          960,
          890,
          36,
          themeColors.yellow,
          'center',
        );
      drawNote(
        ctx,
        api,
        'Launch time and dependent instructions can limit the achieved rate',
      );
    }
  });
}
export default {
  id: 'roofline-model',
  draw: drawRooflineModel,
  cues: [
    'kg-roofline-model-voice-0',
    'kg-roofline-model-voice-1',
    'kg-roofline-model-logical',
    'kg-roofline-model-unique',
    'kg-roofline-model-voice-2',
    'kg-roofline-model-roof',
  ],
};
