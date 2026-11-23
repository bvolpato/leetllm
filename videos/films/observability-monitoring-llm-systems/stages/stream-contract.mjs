import { observationCue } from '../construction.mjs';
import {
  drawCells,
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawLine,
  drawTable,
  withTarget,
} from '../defaults.mjs';
export function drawStreamContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'stream-contract', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'One supplied visible-token clock');
      withTarget(ctx, api, 'visible-count', () => {
        drawCells(
          ctx,
          api,
          Array.from(
            {
              length: 7,
            },
            (_, i) => `T${i + 1}`,
          ),
          140,
          365,
          1620,
          100,
        );
        drawChapterText(
          ctx,
          api,
          'First token is not a post-first token',
          140,
          555,
          32,
          themeColors.yellow,
        );
      });
      withTarget(ctx, api, 'arrival-interval', () => {
        drawLine(ctx, api, 240, 685, 1660, 685, themeColors.muted);
        drawChapterText(ctx, api, 'first = 150ms', 240, 760, 30, themeColors.blue);
        drawChapterText(ctx, api, 'last = 450ms', 1660, 760, 30, themeColors.cyan, 'right');
        if (progress(0, 2) > 0) {
          drawLine(ctx, api, 240, 650, 240, 720, themeColors.blue);
          drawLine(ctx, api, 1660, 650, 1660, 720, themeColors.cyan);
          drawChapterText(
            ctx,
            api,
            '(last − first) / 1000 seconds',
            950,
            630,
            30,
            themeColors.cyan,
            'center',
          );
        }
      });
      withTarget(ctx, api, 'throughput-result', () => {
        if (resultComplete(0, 3))
          drawChapterText(
            ctx,
            api,
            '(7 − 1) / ((450 − 150) / 1000) = 20 tokens/s',
            140,
            940,
            36,
            themeColors.green,
          );
        else
          drawChapterText(
            ctx,
            api,
            'Post-first throughput: pending complete operands',
            140,
            940,
            30,
            themeColors.muted,
          );
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'Undefined or invalid timing is preserved');
      withTarget(ctx, api, 'timing-validation', () => {
        const rows = [
          ['1 visible token', 'no post-first interval'],
          ['7 tokens · first = last', 'zero interval; undefined'],
          ['"7", −1, missing timestamp', 'invalid measurement'],
          ['last < first', 'invalid ordering'],
        ];
        drawTable(ctx, api, ['Supplied case', 'Result'], rows, 140, 335, [900, 720], 110);
        if (resultComplete(1, 5))
          drawChapterText(
            ctx,
            api,
            'Known quality finding remains · timing channel requires repair',
            140,
            960,
            31,
            themeColors.pink,
          );
      });
    } else {
      drawHeading(ctx, api, 'Illustrative delivery: chunks, visible tokens and billed output');
      withTarget(ctx, api, 'measurement-boundaries', () => {
        [
          ['chunk1', 'no text'],
          ['chunk2', 'T1 T2 T3'],
          ['chunk3', 'T4 T5 T6 T7'],
        ].forEach(([id, txt], i) =>
          drawChapterCard(ctx, api, id, txt, 140 + i * 550, 355, 500, themeColors.blue, 145),
        );
        if (resultComplete(2, 2))
          drawChapterCard(
            ctx,
            api,
            'Billed output may also include',
            'hidden reasoning · provider-specific',
            140,
            595,
            1620,
            themeColors.yellow,
            115,
          );
        if (progress(2, 4) > 0) {
          const delay = resultComplete(2, 5) ? 300 : 0;
          drawChapterText(ctx, api, 'Server content: 150→450ms', 140, 800, 31, themeColors.blue);
          drawChapterText(
            ctx,
            api,
            `Client content: ${150 + delay}→${450 + delay}ms`,
            1000,
            800,
            31,
            themeColors.cyan,
          );
          drawLine(ctx, api, 140, 860, 740, 860, themeColors.blue, 9);
          drawLine(ctx, api, 140 + 2 * delay, 910, 740 + 2 * delay, 910, themeColors.cyan, 9);
          drawChapterText(
            ctx,
            api,
            'Closure duration is retained separately',
            140,
            990,
            28,
            themeColors.muted,
          );
        }
      });
    }
  }
  return true;
}
export default {
  id: 'stream-contract',
  draw: drawStreamContract,
  cues: [
    'ob-stream-contract-1-1',
    'ob-stream-contract-1-2',
    'ob-stream-contract-1-3',
    'ob-stream-contract-2-1',
    'ob-stream-contract-2-2',
    'ob-stream-contract-2-3',
    'ob-stream-contract-2-4',
    'ob-stream-contract-2-5',
    'ob-stream-contract-3-1',
    'ob-stream-contract-3-2',
    'ob-stream-contract-3-3',
    'ob-stream-contract-3-4',
    'ob-stream-contract-3-5',
  ],
};
