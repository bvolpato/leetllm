import { observationCue } from '../construction.mjs';
import {
  drawChapterText,
  drawHeading,
  drawRectangle,
  withTarget,
} from '../defaults.mjs';
export function drawHistoryGrowth(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'history-growth', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Every row is one model invocation · complete history resubmitted');
      withTarget(ctx, api, 'history-inputs', () => {
        for (let i = 0; i < 4; i++) {
          const y = 370 + i * 135;
          drawChapterText(ctx, api, 'call' + (i + 1), 140, y + 45, 29, themeColors.blue);
          drawRectangle(ctx, api, 400, y, 520, 70, themeColors.blue, null);
          for (let j = 0; j < i; j++)
            drawRectangle(ctx, api, 920 + j * 170, y, 160, 70, themeColors.cyan, null);
          drawChapterText(
            ctx,
            api,
            i ? 'L₀ + ' + i + 'g' : 'L₀',
            1530,
            y + 45,
            29,
            themeColors.ink,
          );
        }
        if (resultComplete(0, 5))
          drawChapterText(
            ctx,
            api,
            'Cumulative input is the sum of these row lengths',
            140,
            980,
            32,
            themeColors.yellow,
          );
      });
    } else {
      const capped = currentBeat === 2,
        count = currentBeat === 1 && progress(1, 4) === 0 ? 4 : 8,
        lengths = Array.from(
          {
            length: count,
          },
          (_, i) => 100 + 20 * i,
        ),
        cap = capped ? 240 - 120 * progress(2, 1) : Infinity,
        shown = lengths.map((n) => Math.min(n, cap));
      drawHeading(
        ctx,
        api,
        capped
          ? 'Same histories · apply a real 120-token cap'
          : 'Supplied model histories · L₀=100, g=20',
      );
      withTarget(ctx, api, capped ? 'capped-history' : 'history-sum', () => {
        shown.forEach((n, i) => {
          const x = 140 + i * 205;
          drawRectangle(ctx, api, x, 790 - n * 1.5, 170, n * 1.5, themeColors.blue, null);
          if (!capped && i)
            drawRectangle(
              ctx,
              api,
              x,
              790 - (100 + 20 * i) * 1.5,
              170,
              20 * i * 1.5,
              themeColors.cyan,
              null,
            );
          drawChapterText(ctx, api, 'call' + (i + 1), x + 85, 850, 25, themeColors.muted, 'center');
          drawChapterText(
            ctx,
            api,
            Number.isInteger(n) ? n : n.toFixed(0),
            x + 85,
            910,
            29,
            themeColors.ink,
            'center',
          );
        });
        if (capped) {
          if (resultComplete(2, 1))
            drawChapterText(
              ctx,
              api,
              '4 calls: 100+120+120+120=460 · 8 calls: 940',
              140,
              995,
              32,
              themeColors.green,
            );
          else
            drawChapterText(
              ctx,
              api,
              'Cap moves; displayed lengths track the current cut',
              140,
              995,
              29,
              themeColors.yellow,
            );
        } else {
          drawChapterText(ctx, api, 'N L₀ + g N(N−1)/2', 140, 350, 34, themeColors.yellow);
          if (count === 4 && resultComplete(1, 3))
            drawChapterText(ctx, api, '4 calls:520 input tokens', 1040, 350, 33, themeColors.green);
          if (count === 8 && resultComplete(1, 4))
            drawChapterText(
              ctx,
              api,
              '8 calls: 1360 input tokens',
              1040,
              350,
              33,
              themeColors.green,
            );
        }
      });
    }
  }
  return true;
}
export default {
  id: 'history-growth',
  draw: drawHistoryGrowth,
  cues: [
    'ob-history-growth-1-1',
    'ob-history-growth-1-2',
    'ob-history-growth-1-3',
    'ob-history-growth-1-4',
    'ob-history-growth-1-5',
    'ob-history-growth-2-1',
    'ob-history-growth-2-2',
    'ob-history-growth-2-3',
    'ob-history-growth-2-4',
    'ob-history-growth-2-5',
    'ob-history-growth-3-1',
    'ob-history-growth-3-2',
    'ob-history-growth-3-3',
    'ob-history-growth-3-4',
  ],
};
