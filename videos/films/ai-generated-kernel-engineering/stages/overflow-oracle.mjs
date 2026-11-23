import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawOverflowOracle(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('overflow-oracle', state),
    colors = [
      themeColors.blue,
      themeColors.cyan,
      themeColors.pink,
      themeColors.green,
      themeColors.yellow,
    ];
  api.focus.target('overflow-oracle-construction', () => {
    if (currentBeat < 2) {
      drawTitle(
        ctx,
        api,
        'What does the CPU reference return?',
        'One input, squared in float32',
      );
      const doubled = at('double', 0);
      const large = doubled ? 2e19 : 1e19,
        squared = Math.fround(Math.fround(large) * Math.fround(large)),
        zero = at('zero', 0),
        showSquare = doubled ? at('overflow', 0) : at('finite', 0);
      drawRow(
        ctx,
        api,
        [
          large.toExponential(0),
          showSquare ? (Number.isFinite(squared) ? squared.toExponential(2) : '+∞') : 'square?',
        ],
        250,
        450,
        1350,
        themeColors.blue,
      );
      drawChapterText(ctx, api, 'input', 570, 410, 30, themeColors.blue, 'center');
      drawChapterText(ctx, api, 'float32 square', 1230, 410, 30, themeColors.cyan, 'center');
      if (zero) {
        drawRow(ctx, api, ['rsqrt(+∞) = 0', 'finite × 0 = 0'], 250, 625, 1350, themeColors.pink);
      }
      if (currentBeat === 1) {
        drawRow(
          ctx,
          api,
          ['float64 square stays finite', 'normalized output ≈ 1'],
          250,
          810,
          1350,
          themeColors.green,
        );
      }
      drawNote(
        ctx,
        api,
        currentBeat === 0
          ? 'The overflow happens before normalization can rescale the value'
          : 'The reference precision determines which result the test accepts',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'Change one part of a test call',
        'Keep the other inputs fixed',
      );
      const axes = [
        ['Width', '127', '128', '129'],
        ['Layout', 'offset', 'alignment', 'strides'],
        ['Values', '0', 'subnormal', 'mixed signs'],
        ['Nonfinite', 'NaN position', '+∞', '−∞'],
      ];
      axes.forEach((a, i) => {
        drawChapterText(ctx, api, a[0], 210, 440 + i * 125, 31, colors[i]);
        drawRow(
          ctx,
          api,
          a.slice(1),
          560,
          390 + i * 125,
          1120,
          i < Math.ceil(progress * 4) ? colors[i] : themeColors.muted,
        );
      });
      drawNote(
        ctx,
        api,
        'Record the values, widths and layouts exercised by each run',
      );
    }
  });
}
export default {
  id: 'overflow-oracle',
  draw: drawOverflowOracle,
  cues: [
    'kg-overflow-oracle-voice-0',
    'kg-overflow-oracle-finite',
    'kg-overflow-oracle-double',
    'kg-overflow-oracle-overflow',
    'kg-overflow-oracle-zero',
    'kg-overflow-oracle-voice-1',
    'kg-overflow-oracle-voice-2',
  ],
};
