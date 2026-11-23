import { clamp } from '../arithmetic.mjs';
import { observationCue } from '../construction.mjs';
import {
  drawCells,
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawLine,
  withTarget,
} from '../defaults.mjs';
export function drawPercentileContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'percentile-contract', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    const input = [170, 220, 180, 260, 200, 240, 190, 210],
      sorted = [...input].sort((a, b) => a - b);
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Eight first-output times  /  nearest rank');
      withTarget(ctx, api, 'sorted-timings', () => {
        const order = input.map((v, i) => ({
          v,
          i,
          target: sorted.indexOf(v),
        }));
        order.forEach((r) => {
          const q = progress(0, 1),
            move = clamp((q - 1 / 3) * 3),
            spread = clamp(q * 3),
            settle = clamp((q - 2 / 3) * 3),
            x = 140 + (r.i + (r.target - r.i) * move) * 205,
            y = 440 + (340 + r.i * 80 - 440) * spread * (1 - settle);
          drawChapterCard(
            ctx,
            api,
            '' + r.v + 'ms',
            '',
            x,
            y,
            185,
            r.target === 7 && resultComplete(0, 3) ? themeColors.yellow : themeColors.blue,
            65,
            25,
          );
        });
      });
      withTarget(ctx, api, 'percentile-rank', () => {
        if (!resultComplete(0, 2) && progress(0, 2) > 0)
          drawChapterText(
            ctx,
            api,
            'Rank calculation: ceil(q × count)',
            140,
            705,
            32,
            themeColors.muted,
          );
        if (resultComplete(0, 2)) {
          drawChapterText(
            ctx,
            api,
            'ceil(0.95 × 8) = ceil(7.6) = 8',
            140,
            705,
            38,
            themeColors.yellow,
          );
          drawLine(ctx, api, 1665, 565, 1665, 650, themeColors.yellow);
        }
      });
      withTarget(ctx, api, 'percentile-result', () => {
        if (!resultComplete(0, 3) && progress(0, 3) > 0)
          drawChapterText(
            ctx,
            api,
            'Read the last tile',
            140,
            900,
            30,
            themeColors.muted,
          );
        if (resultComplete(0, 3))
          drawChapterText(
            ctx,
            api,
            'Rank 8  ·  260 ms  ·  slowest of eight',
            140,
            900,
            35,
            themeColors.green,
          );
      });
    } else {
      drawHeading(ctx, api, 'Successful output timing has its own population');
      withTarget(ctx, api, 'latency-populations', () => {
        drawCells(
          ctx,
          api,
          sorted.map((x) => x + 'ms'),
          140,
          385,
          1620,
          100,
        );
        drawChapterText(
          ctx,
          api,
          '8 completed first-output observations · supplied window W1',
          140,
          590,
          31,
          themeColors.blue,
        );
        if (progress(1, 2) > 0) {
          drawChapterCard(
            ctx,
            api,
            'Failed request',
            'no first output',
            140,
            700,
            760,
            themeColors.pink,
            140,
          );
          drawChapterCard(
            ctx,
            api,
            'Cancelled request',
            'no first output',
            1000,
            700,
            760,
            themeColors.yellow,
            140,
          );
        }
        if (resultComplete(1, 3))
          drawChapterText(
            ctx,
            api,
            'Count and time both outcomes separately; retain cohort membership',
            140,
            965,
            30,
            themeColors.cyan,
          );
      });
    }
  }
  return true;
}
export default {
  id: 'percentile-contract',
  draw: drawPercentileContract,
  cues: [
    'ob-percentile-contract-1-1',
    'ob-percentile-contract-1-2',
    'ob-percentile-contract-1-3',
    'ob-percentile-contract-2-1',
    'ob-percentile-contract-2-2',
    'ob-percentile-contract-2-3',
    'ob-percentile-contract-2-4',
  ],
};
