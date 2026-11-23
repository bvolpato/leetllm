import { clamp } from '../arithmetic.mjs';
import { drawText, footer, line, mark } from '../defaults.mjs';
export function drawLatencyPath(ctx, scene, state, api) {
  return api.focus.target('latency-path-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    const cueComplete = (id) => cueProgress(id) === 1;
    {
      const changed = currentBeat > 1 || (currentBeat === 1 && cueVisible('clock-change')),
        queueWarm = changed ? 20 + 1180 * (currentBeat > 1 ? 1 : cueProgress('clock-change')) : 20;
      const rows = [
        {
          name: 'Cold',
          queue: 20,
          work: 1220,
        },
        {
          name: 'Warm',
          queue: queueWarm,
          work: 170,
        },
      ];
      drawText(
        ctx,
        api,
        'Authored serial dependency clocks · same prompt and remaining output',
        150,
        270,
        30,
      );
      const scale = 1450 / 2400,
        start = 280;
      line(ctx, api, start, 825, start + 2400 * scale, 825, themeColors.muted, 2);
      [0, 500, 1000, 1500, 2000].forEach((v) => {
        line(ctx, api, start + v * scale, 825, start + v * scale, 837, themeColors.muted, 2);
        drawText(ctx, api, v + ' ms', start + v * scale, 875, 23, themeColors.muted, 'center');
      });
      rows.forEach((row, i) => {
        const y = 440 + i * 250,
          queueW = row.queue * scale,
          workW = row.work * scale;
        drawText(ctx, api, row.name, 150, y + 43, 29, themeColors.ink);
        if (currentBeat || cueVisible('clock-queue')) {
          api.rect(ctx, start, y, queueW, 70, themeColors.yellow);
          drawText(
            ctx,
            api,
            'queue ' + Math.round(row.queue),
            start + queueW / 2,
            y - 25,
            25,
            themeColors.yellow,
            'center',
          );
        }
        if (currentBeat || cueVisible('clock-work')) {
          api.rect(ctx, start + queueW, y, workW, 70, themeColors.blue);
          drawText(
            ctx,
            api,
            'work ' + row.work,
            start + queueW + workW / 2,
            y + 118,
            25,
            themeColors.blue,
            'center',
          );
        }
        const first = row.queue + row.work;
        if (
          currentBeat > 1 ||
          (currentBeat === 1 && cueComplete('clock-arrival')) ||
          (currentBeat === 0 && cueVisible('clock-queue'))
        ) {
          line(
            ctx,
            api,
            start + first * scale,
            y - 10,
            start + first * scale,
            y + 90,
            themeColors.green,
            4,
          );
          drawText(
            ctx,
            api,
            'first ' + Math.round(first),
            start + first * scale + 12,
            y + 45,
            25,
            themeColors.green,
          );
        }
        if (currentBeat > 0 || cueVisible('clock-decode'))
          api.rect(ctx, start + first * scale, y + 82, 880 * scale, 25, themeColors.cyan);
      });
      if (currentBeat === 1)
        mark(ctx, api, 'clock-total', () => {
          drawText(
            ctx,
            api,
            cueComplete('clock-total')
              ? 'Completion: cold 2,120 ms · warm 2,250 ms'
              : 'Completion totals pending',
            960,
            965,
            35,
            cueComplete('clock-total') ? themeColors.pink : themeColors.muted,
            'center',
          );
        });
      if (currentBeat === 2)
        mark(ctx, api, 'clock-path', () =>
          drawText(
            ctx,
            api,
            'First token = queue + processing + required transfer dependencies',
            960,
            970,
            29,
            themeColors.yellow,
            'center',
          ),
        );
      if (currentBeat === 0)
        footer(
          ctx,
          api,
          'Blue builds first-token state; cyan is the unchanged 880ms remaining generation.',
        );
    }
  });
}
export default {
  id: 'latency-path',
  draw: drawLatencyPath,
  cues: [
    'clock-work',
    'clock-decode',
    'clock-queue',
    'clock-change',
    'clock-arrival',
    'clock-total',
    'clock-path',
  ],
};
