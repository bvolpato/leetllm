import { EVENTS } from '../fixtures.mjs';
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
export function drawTailTiming(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'tail-timing', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'When does the review arrive?');
      withTarget(ctx, api, 'sampling-clock', () => {
        const x = (t) => 180 + t * 25;
        drawLine(ctx, api, x(0), 560, x(60), 560, themeColors.muted);
        for (const [time, label, color] of [
          [0, 'Head choice', themeColors.blue],
          [10, 'Tail decision', themeColors.yellow],
          [60, 'Quality review', themeColors.pink],
        ]) {
          drawLine(ctx, api, x(time), 530, x(time), 590, color);
          drawChapterText(ctx, api, time + 's', x(time), 650, 30, color, 'center');
          drawChapterText(ctx, api, label, x(time), time === 10 ? 420 : 750, 27, color, 'center');
        }
        const q = progress(0, 3);
        if (q > 0) {
          const now = 60 * q;
          drawRectangle(ctx, api, x(0), 550, x(now) - x(0), 20, themeColors.cyan, null);
        }
        if (resultComplete(0, 4))
          drawChapterText(
            ctx,
            api,
            'Decision at 10 s   ·   review arrives 50 s later',
            140,
            940,
            32,
            themeColors.pink,
          );
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'Keep the spans for trace A together');
      withTarget(ctx, api, 'collector-state', () => {
        const ready = resultComplete(1, 1);
        ['A/root', 'A/tool', 'A/gate'].forEach((v, i) =>
          drawChapterCard(ctx, api, v, 'trace A', 140, 350 + i * 140, 460, themeColors.blue, 105),
        );
        drawChapterCard(
          ctx,
          api,
          'Collector1',
          ready ? 'all trace A spans' : 'A/root and A/tool',
          960,
          350,
          800,
          themeColors.cyan,
          150,
        );
        drawChapterCard(
          ctx,
          api,
          'Collector2',
          ready ? 'no trace A split' : 'A/gate alone',
          960,
          620,
          800,
          ready ? themeColors.muted : themeColors.pink,
          150,
        );
        if (progress(1, 1) > 0) {
          drawLine(ctx, api, 650, 400, 920, 390, themeColors.cyan);
          drawLine(ctx, api, 650, 540, 920, 425, themeColors.cyan);
          drawLine(ctx, api, 650, 680, 920, ready ? 460 : 695, themeColors.cyan);
        }
        if (resultComplete(1, 2))
          drawChapterText(
            ctx,
            api,
            'Buffers: finite memory · trace limit · late-span / shutdown policy',
            140,
            970,
            30,
            themeColors.yellow,
          );
      });
    } else {
      drawHeading(ctx, api, 'Request counters are upstream of exemplar selection');
      withTarget(ctx, api, 'counter-before-sampling', () => {
        drawCells(
          ctx,
          api,
          EVENTS.map((e) => e.id),
          140,
          355,
          1620,
          95,
        );
        drawChapterText(
          ctx,
          api,
          'Ingress ledger: 6 · detected unsafe serves: 2',
          140,
          565,
          34,
          themeColors.blue,
        );
        const retained = ['201', '205', '206'];
        if (progress(2, 2) > 0) {
          drawCells(ctx, api, retained, 140, 730, 1620, 95, [
            themeColors.blue,
            themeColors.pink,
            themeColors.pink,
          ]);
          drawChapterText(
            ctx,
            api,
            'Retained trace store: 3 · two unsafe exemplars',
            140,
            925,
            32,
            themeColors.pink,
          );
        }
        if (resultComplete(2, 4))
          drawChapterText(
            ctx,
            api,
            'Trace store   2 / 3      All requests   2 / 6',
            140,
            990,
            29,
            themeColors.yellow,
          );
      });
    }
  }
  return true;
}
export default {
  id: 'tail-timing',
  draw: drawTailTiming,
  cues: [
    'ob-tail-timing-1-1',
    'ob-tail-timing-1-2',
    'ob-tail-timing-1-3',
    'ob-tail-timing-1-4',
    'ob-tail-timing-2-1',
    'ob-tail-timing-2-2',
    'ob-tail-timing-2-3',
    'ob-tail-timing-2-4',
    'ob-tail-timing-3-1',
    'ob-tail-timing-3-2',
    'ob-tail-timing-3-3',
    'ob-tail-timing-3-4',
  ],
};
