import { complete, sentence } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterFooter,
  drawChapterGrid,
  drawChapterText,
} from '../defaults.mjs';
export function drawBucketUnits(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'bucket-units', beat, index),
    resultComplete = (beat, index) => complete(state, 'bucket-units', beat, index);
  api.focus.target('bucket-units-construction', () => {
    if (currentBeat === 0) {
      const n = sentenceProgress(0, 0);
      drawChapterText(
        ctx,
        api,
        'Bucket field: 200,000,000 elements',
        960,
        315,
        40,
        themeColors.yellow,
        'center',
      );
      const filled = Math.floor(n * 10);
      drawChapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 10,
            },
            (_, i) => (i < filled ? '20M' : ''),
          ),
        ],
        180,
        430,
        1560,
        110,
        themeColors.blue,
        32,
      );
      drawChapterText(
        ctx,
        api,
        'Same element count · different buffer widths',
        960,
        660,
        33,
        themeColors.muted,
        'center',
      );
      if (resultComplete(0, 2)) {
        drawChapterText(
          ctx,
          api,
          '2 bytes × 200M = 400 MB',
          520,
          810,
          37,
          themeColors.cyan,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          '4 bytes × 200M = 800 MB',
          1410,
          810,
          37,
          themeColors.pink,
          'center',
        );
      }
      drawChapterFooter(ctx, api, 'Decimal bytes · inspect the actual buffer dtype');
    } else {
      const changed = currentBeat === 2 && sentenceProgress(2, 2) > 0,
        dp = changed ? 3 : 4,
        tp = 12 / dp;
      drawChapterText(
        ctx,
        api,
        '12 physical GPUs · tensor degree ' + tp + ' · data degree ' + dp,
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      for (let rank = 0; rank < dp; rank++) {
        const width = 1600 / dp - 40,
          x = 160 + (rank * 1600) / dp;
        drawChapterCard(
          ctx,
          api,
          'Data replica ' + rank,
          x,
          370,
          width,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][rank],
          80,
          28,
        );
        drawChapterGrid(
          ctx,
          api,
          [
            Array.from(
              {
                length: tp,
              },
              (_, i) => 'TP ' + i,
            ),
          ],
          x,
          510,
          width,
          85,
          themeColors.muted,
          28,
        );
      }
      if (resultComplete(1, 1)) {
        drawChapterText(
          ctx,
          api,
          'Same examples within each tensor group',
          960,
          720,
          31,
          themeColors.muted,
          'center',
        );
      }
      if (currentBeat === 1 && resultComplete(1, 2)) {
        drawChapterText(
          ctx,
          api,
          'Microbatch 2 × accumulation 8 × data degree 4 = 64 examples',
          960,
          840,
          37,
          themeColors.green,
          'center',
        );
      }
      if (currentBeat === 2) {
        const result = changed ? resultComplete(2, 2) : resultComplete(2, 0);
        drawChapterText(
          ctx,
          api,
          'Resolved global batch: 2 × 8 × ' + dp + ' = ' + (result ? String(16 * dp) : '?'),
          960,
          840,
          39,
          result ? themeColors.green : themeColors.yellow,
          'center',
        );
        drawChapterFooter(
          ctx,
          api,
          'Microbatch and accumulation fixed · changed tensor grouping changes independent data degree',
          975,
          themeColors.cyan,
        );
      }
    }
  });
}
export default {
  id: 'bucket-units',
  draw: drawBucketUnits,
  cues: [
    'ds-bucket-units-b0-s0',
    'ds-bucket-units-b0-s1',
    'ds-bucket-units-b0-s2',
    'ds-bucket-units-b0-s3',
    'ds-bucket-units-b1-s0',
    'ds-bucket-units-b1-s1',
    'ds-bucket-units-b1-s2',
    'ds-bucket-units-b1-s3',
    'ds-bucket-units-b2-s0',
    'ds-bucket-units-b2-s1',
    'ds-bucket-units-b2-s2',
  ],
};
