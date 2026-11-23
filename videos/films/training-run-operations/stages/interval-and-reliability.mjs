import { clamp, motion } from '../arithmetic.mjs';
import { trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawFooter, drawLine, drawRow, drawText } from '../defaults.mjs';
export function drawIntervalAndReliability(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    q = motion(progress);
  api.focus.target('interval-and-reliability-mechanism', () => {
    if (beat === 0) {
      const x = 240,
        y = 530,
        minute = 280,
        interval = 5;
      const elapsed = 3 * trainingCue(state, 'interval-exposed', clamp(progress * 2));
      const failed = trainingStarted(state, 'interval-cut', progress > 0.5);
      drawText(ctx, api, 'Time since the last published checkpoint', x, 287, 43, themeColors.ink);
      drawLine(ctx, api, x, y, x + interval * minute, y, themeColors.muted, 4);
      if (elapsed > 0) drawLine(ctx, api, x, y, x + elapsed * minute, y, themeColors.blue, 11);
      for (let i = 0; i <= interval; i++) {
        const xx = x + i * minute;
        drawLine(ctx, api, xx, y + 14, xx, y + 35, themeColors.muted, 3);
        drawText(ctx, api, i + ' min', xx, y + 91, 33, themeColors.muted, 'center');
      }
      drawText(ctx, api, 'Published', x, 457, 36, themeColors.cyan, 'center');
      drawText(
        ctx,
        api,
        'Next save due',
        x + interval * minute,
        457,
        36,
        themeColors.muted,
        'center',
      );
      if (failed) {
        drawLine(ctx, api, x + 3 * minute, 401, x + 3 * minute, y - 14, themeColors.pink, 5);
        drawText(ctx, api, 'Workers lost', x + 3 * minute, 368, 41, themeColors.pink, 'center');
        drawText(
          ctx,
          api,
          '3 minutes of compute to replay',
          960,
          828,
          53,
          themeColors.yellow,
          'center',
        );
      }
      drawFooter(
        ctx,
        api,
        'Example with a scheduled save every five minutes of productive compute.',
      );
    } else if (beat === 1) {
      drawText(
        ctx,
        api,
        'Same 90-second blocking save · different exposed work',
        960,
        280,
        36,
        themeColors.blue,
        'center',
      );
      for (const [i, compute] of [300, 1200].entries()) {
        const y = 365 + i * 270,
          scale = 1450 / 1290;
        drawBox(ctx, api, 240, y, compute * scale, 120, themeColors.blue);
        drawBox(ctx, api, 240 + compute * scale, y, 90 * scale, 120, themeColors.cyan);
        drawText(
          ctx,
          api,
          compute + ' s compute',
          240 + (compute * scale) / 2,
          y + 76,
          34,
          themeColors.blue,
          'center',
        );
        drawText(
          ctx,
          api,
          '90',
          240 + (compute + 45) * scale,
          y + 75,
          28,
          themeColors.cyan,
          'center',
        );
        const cue = i ? 'interval-second' : 'interval-first';
        if (trainingStarted(state, cue, progress > (i ? 0.55 : 0.2)))
          drawText(
            ctx,
            api,
            ((100 * 90) / (compute + 90)).toFixed(1) + '% saving',
            960,
            y + 205,
            37,
            themeColors.yellow,
            'center',
          );
      }
      drawFooter(
        ctx,
        api,
        'Lower overhead exposes a longer compute interval. Asynchronous work is uncommitted until publication.',
      );
    } else {
      drawText(
        ctx,
        api,
        'Historical report · one 54-day Llama 3 period',
        960,
        285,
        36,
        themeColors.blue,
        'center',
      );
      const unit = 1450 / 466;
      drawBox(ctx, api, 220, 385, 419 * unit, 150, themeColors.pink);
      drawBox(ctx, api, 220 + 419 * unit, 385, 47 * unit, 150, themeColors.yellow);
      drawText(ctx, api, '419 unexpected', 870, 480, 46, themeColors.pink, 'center');
      drawText(ctx, api, '47', 220 + (419 + 23.5) * unit, 480, 36, themeColors.yellow, 'center');
      drawText(
        ctx,
        api,
        'Simplified independent constant-rate model',
        960,
        650,
        32,
        themeColors.muted,
        'center',
      );
      const n = 1 + Math.floor(q * 7);
      drawRow(
        ctx,
        api,
        Array.from(
          {
            length: 8,
          },
          (_, i) => (i < n ? 'GPU' : '—'),
        ),
        220,
        720,
        175,
        themeColors.cyan,
      );
      drawText(
        ctx,
        api,
        'cluster MTBF = device MTBF / ' + n,
        960,
        900,
        40,
        themeColors.yellow,
        'center',
      );
      drawFooter(
        ctx,
        api,
        'Not a measured universal device rate. Shared faults and software failures violate the toy model.',
      );
    }
  });
}
export default {
  id: 'interval-and-reliability',
  draw: drawIntervalAndReliability,
  cues: [
    'interval-exposed',
    'interval-cut',
    'interval-and-reliability-step-2',
    'interval-first',
    'interval-second',
    'interval-and-reliability-step-3',
    'interval-history',
  ],
};
