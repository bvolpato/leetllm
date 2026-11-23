import { RUNS, SCHEDULED } from '../fixtures.mjs';
import { fmt, pair, scheduledRate } from '../arithmetic.mjs';
import { cueProgress, traceState } from '../construction.mjs';
import {
  drawOptimizerFocus,
  drawOptimizerHeader,
  drawOptimizerLane,
  drawOptimizerText,
} from '../defaults.mjs';
import { preserveLegacyPaletteReads } from '../compatibility.mjs';
export function drawSchedule(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const q = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  preserveLegacyPaletteReads(themeColors);
  {
    drawOptimizerHeader(
      ctx,
      api,
      themeColors,
      'Adam · same moment rule and objective · only the rate rule changes',
      '40 updates · k = t − 1',
    );
    const zero = q('schedule-zero-update', 0, 0.15, 0.33);
    const warmup = zero === 1 ? q('schedule-warmup', 0, 0.62, 0.8) : 0;
    const f =
      currentBeat === 0
        ? zero < 1
          ? traceState(SCHEDULED, zero, 0, 1)
          : traceState(SCHEDULED, warmup, 1, 5)
        : traceState(SCHEDULED, currentBeat === 1 ? q('schedule-decay', 1, 0.01, 0.55) : 1, 5, 40);
    if (currentBeat < 2)
      drawOptimizerFocus(ctx, api, 'scheduled-updates', () => {
        const plot = teaching.axes({
          color: themeColors.muted,
          x: 260,
          y: 350,
          width: 795,
          height: 230,
          xDomain: currentBeat === 0 ? [0, 4] : [0, 39],
          yDomain: [0, 0.09],
          xTicks: currentBeat === 0 ? [0, 1, 2, 3, 4] : [0, 4, 20, 39],
          yTicks: [0, 0.08],
          xLabel: 'zero-based update k',
          yLabel: 'learning rate ηₖ',
          fontSize: 26,
        });
        const points = Array.from(
          {
            length: f.completed,
          },
          (_, k) => ({
            x: k,
            y: scheduledRate(k),
          }),
        );
        teaching.curve({
          plot,
          points,
          color: themeColors.cyan,
          width: 5,
        });
        if (points.length) {
          const p = plot.point(points.at(-1).x, points.at(-1).y);
          api.circle(ctx, p.x, p.y, 7, themeColors.bg, themeColors.cyan, 3);
        }
        const last = SCHEDULED.records[f.completed - 1];
        const eta = last?.eta ?? 0;
        api.text(ctx, 'Stored history for a', 1220, 362, 39, themeColors.ink);
        api.text(ctx, 'Signed mean   m', 1220, 460, 32, themeColors.muted);
        api.text(ctx, fmt(last?.mean[0] ?? 0), 1745, 460, 45, themeColors.green, 'right');
        api.text(ctx, 'Mean square   v', 1220, 560, 32, themeColors.muted);
        api.text(ctx, fmt(last?.square[0] ?? 0), 1745, 560, 45, themeColors.yellow, 'right');
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'Completed t = ' + f.completed + '  ·  last η = ' + fmt(eta, 5),
          260,
          690,
          32,
          themeColors.cyan,
        );
        const position = (v) => 438 + v * 1150;
        for (const [i, color] of [themeColors.cyan, themeColors.green].entries()) {
          const y = 770 + i * 70;
          const moving = f.current[i] + f.fraction * (f.pending?.update[i] ?? 0);
          api.text(ctx, i ? 'b' : 'a', 262, y + 12, 39, color);
          api.line(ctx, position(-0.12), y, position(1.06), y, themeColors.muted, 2);
          api.line(ctx, position(0), y - 12, position(0), y + 12, themeColors.ink, 2);
          api.line(ctx, position(1), y - 12, position(1), y + 12, themeColors.ink, 2);
          api.line(ctx, position(1), y, position(moving), y, color, 5);
          api.circle(ctx, position(moving), y, 11, color);
        }
        api.text(ctx, 'target 0', position(0), 902, 28, themeColors.muted, 'center');
        api.text(ctx, 'start 1', position(1), 902, 28, themeColors.muted, 'center');
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          '(a, b) ≈ ' + pair(f.current, 4) + '  ·  endpoint L ≈ ' + fmt(f.currentLoss, 5),
          260,
          967,
          32,
          themeColors.green,
        );
        if (f.completed === 40)
          drawOptimizerText(
            ctx,
            api,
            themeColors,
            'Final zero rate   ·   moments update, parameters hold',
            260,
            1010,
            28,
            themeColors.muted,
          );
      });
    if (currentBeat === 2)
      drawOptimizerFocus(ctx, api, 'schedule-comparison', () => {
        const qLate = q('schedule-late', 2, 0.01, 0.42);
        for (const [i, run] of [RUNS.adam, SCHEDULED].entries()) {
          const fLate = traceState(run, qLate, 35, 40),
            r = fLate.pending ?? run.records[39],
            y = 470 + i * 320;
          drawOptimizerLane(ctx, api, themeColors, {
            x: 280,
            y,
            width: 1300,
            domain: [-0.15, 0.08],
            before: fLate.current[0],
            after: fLate.pending ? r.next[0] : fLate.current[0],
            amount: fLate.fraction,
            color: i ? themeColors.cyan : themeColors.green,
            caption:
              (i ? 'Warmup + cosine' : 'Constant η = 0.08') + ' · completed ' + fLate.completed,
          });
          const last = run.records[Math.max(0, fLate.completed - 1)];
          drawOptimizerText(
            ctx,
            api,
            themeColors,
            'a ≈ ' +
              fmt(fLate.current[0], 5) +
              '  ·  last η = ' +
              fmt(last.eta, 5) +
              '  ·  L ≈ ' +
              fmt(fLate.currentLoss, 5),
            280,
            y + 120,
            32,
            i ? themeColors.cyan : themeColors.green,
          );
        }
        if (qLate === 1)
          drawOptimizerText(
            ctx,
            api,
            themeColors,
            'The decayed run finishes farther from zero.',
            960,
            1010,
            31,
            themeColors.yellow,
            'center',
          );
      });
  }
}
export default {
  id: 'schedule',
  draw: drawSchedule,
  cues: ['schedule-zero-update', 'schedule-warmup', 'schedule-decay', 'schedule-late'],
};
