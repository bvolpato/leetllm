import { observationCue } from '../construction.mjs';
import {
  drawCells,
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawLine,
  drawRectangle,
  withTarget,
} from '../defaults.mjs';
export function drawSignalsRuntime(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'signals-runtime', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Where is the wait?');
      withTarget(ctx, api, 'workload-state', () => {
        drawChapterCard(
          ctx,
          api,
          'Case A · server pressure',
          'Arrivals exceed departures',
          140,
          350,
          760,
          themeColors.blue,
          130,
        );
        drawChapterCard(
          ctx,
          api,
          'Case B · client delivery',
          'Slow visible delivery',
          1000,
          350,
          760,
          themeColors.yellow,
          130,
        );
        const q = Math.ceil(6 * progress(0, 3));
        drawCells(
          ctx,
          api,
          Array.from(
            {
              length: 6,
            },
            (_, i) => (i < q ? 'queued' : 'empty'),
          ),
          140,
          575,
          760,
          80,
        );
        drawCells(
          ctx,
          api,
          Array.from(
            {
              length: 6,
            },
            () => 'empty',
          ),
          1000,
          575,
          760,
          80,
        );
        if (progress(0, 4) > 0) {
          drawCells(
            ctx,
            api,
            Array.from(
              {
                length: 6,
              },
              (_, i) => (i < 5 ? 'KV used' : 'free'),
            ),
            140,
            755,
            760,
            80,
          );
          drawCells(
            ctx,
            api,
            Array.from(
              {
                length: 6,
              },
              (_, i) => (i < 1 ? 'KV used' : 'free'),
            ),
            1000,
            755,
            760,
            80,
          );
        }
        drawChapterText(
          ctx,
          api,
          'Queue + cache occupancy + batch shape + utilization',
          140,
          970,
          31,
          themeColors.cyan,
        );
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'Four prompt positions, then four output tokens');
      withTarget(ctx, api, 'prefill-decode', () => {
        drawChapterText(
          ctx,
          api,
          'Prefill: prompt positions can process together',
          140,
          365,
          31,
          themeColors.blue,
        );
        drawCells(ctx, api, ['P1', 'P2', 'P3', 'P4'], 140, 420, 1620, 90);
        if (progress(1, 2) > 0) {
          drawChapterText(
            ctx,
            api,
            'Decode: successive outputs depend on preceding tokens',
            140,
            640,
            31,
            themeColors.cyan,
          );
          const n = Math.max(1, Math.ceil(4 * progress(1, 2)));
          drawCells(
            ctx,
            api,
            Array.from(
              {
                length: 4,
              },
              (_, i) => (i < n ? `O${i + 1}` : 'pending'),
            ),
            140,
            695,
            1620,
            90,
          );
          for (let i = 0; i < n - 1; i++)
            drawLine(
              ctx,
              api,
              140 + (i + 1) * 405 - 10,
              740,
              140 + (i + 1) * 405 + 7,
              740,
              themeColors.cyan,
              4,
            );
        }
        if (progress(1, 3) > 0) {
          const reads = Math.ceil(4 * progress(1, 3));
          for (let i = 0; i < reads; i++) {
            const x = 140 + i * 410;
            drawChapterCard(
              ctx,
              api,
              'Output ' + (i + 1) + ' reads',
              'weights + prior KV',
              x,
              845,
              370,
              themeColors.yellow,
              105,
              25,
            );
            for (let j = 0; j <= i; j++)
              drawRectangle(ctx, api, x + j * 72, 970, 60, 25, themeColors.cyan, null);
          }
        }
      });
    } else {
      drawHeading(ctx, api, 'OpenTelemetry GenAI  ·  revision cc07f722');
      withTarget(ctx, api, 'convention-boundaries', () => {
        drawChapterCard(
          ctx,
          api,
          'Client delivery metric',
          ['first content chunk / per chunk', 'seconds · client boundary'],
          140,
          365,
          760,
          themeColors.blue,
          180,
        );
        drawChapterCard(
          ctx,
          api,
          'Server output metric',
          ['successful first token / per token', 'seconds · server boundary'],
          1000,
          365,
          760,
          themeColors.cyan,
          180,
        );
        if (progress(2, 4) > 0)
          drawChapterCard(
            ctx,
            api,
            'Application clock',
            ['starts at dispatch', 'milliseconds'],
            140,
            665,
            760,
            themeColors.yellow,
            170,
          );
        if (resultComplete(2, 5)) {
          drawChapterCard(
            ctx,
            api,
            'Unit conversion',
            '240ms = 0.24s',
            1000,
            665,
            760,
            themeColors.green,
            170,
          );
          drawChapterText(
            ctx,
            api,
            'Compare clocks with the same start and stop events.',
            140,
            965,
            31,
            themeColors.yellow,
          );
        }
      });
    }
  }
  return true;
}
export default {
  id: 'signals-runtime',
  draw: drawSignalsRuntime,
  cues: [
    'ob-signals-runtime-1-1',
    'ob-signals-runtime-1-2',
    'ob-signals-runtime-1-3',
    'ob-signals-runtime-1-4',
    'ob-signals-runtime-1-5',
    'ob-signals-runtime-2-1',
    'ob-signals-runtime-2-2',
    'ob-signals-runtime-2-3',
    'ob-signals-runtime-2-4',
    'ob-signals-runtime-2-5',
    'ob-signals-runtime-3-1',
    'ob-signals-runtime-3-2',
    'ob-signals-runtime-3-3',
    'ob-signals-runtime-3-4',
    'ob-signals-runtime-3-5',
  ],
};
