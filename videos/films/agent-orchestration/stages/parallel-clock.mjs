import { focusTarget, graphText } from '../defaults.mjs';
export function drawParallelClock(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase, clamp } = api,
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = phase(progress, 0.05, 0.88);
  {
    const durations = [2, 3, 1],
      serial = beat === 0,
      readEnd = serial ? 6 : 3,
      elapsed =
        beat > 1
          ? 3.5
          : serial
            ? api.focus.progress('serial-reads', q) * 6.5
            : api.focus.progress('parallel-reads', q) * 3 +
              api.focus.progress('merge-overhead', clamp((q - 0.85) / 0.15)) * 0.5,
      offsets = serial ? [0, 2, 5] : [0, 0, 0],
      scale = 180;
    const totalComplete = serial
      ? elapsed >= readEnd + 0.5
      : beat > 1 || api.focus.progress('parallel-total', q) >= 1;
    focusTarget(ctx, api, 'read-time-comparison', () =>
      graphText(
        ctx,
        api,
        totalComplete
          ? serial
            ? 'Serial: 6 + 0.5 = 6.5 seconds'
            : 'Parallel: 3 + 0.5 = 3.5 seconds'
          : serial
            ? 'Serial: complete each read before the next'
            : 'Parallel: merge waits for the last read',
        960,
        270,
        40,
        themeColors.ink,
        'center',
      ),
    );
    durations.forEach((duration, i) =>
      focusTarget(ctx, api, ['eval-read', 'health-read', 'policy-read'][i], () => {
        const y = 355 + i * 150,
          amount = clamp((elapsed - offsets[i]) / duration),
          x = 500 + offsets[i] * 180;
        graphText(
          ctx,
          api,
          ['Eval', 'Health', 'Policy'][i],
          440,
          y + 49,
          32,
          [themeColors.blue, themeColors.pink, themeColors.green][i],
          'right',
        );
        api.rect(ctx, x, y, duration * 180, 72, themeColors.panel, themeColors.muted, 8);
        if (amount > 0)
          api.rect(
            ctx,
            x,
            y,
            duration * 180 * amount,
            72,
            [themeColors.blue, themeColors.pink, themeColors.green][i],
            undefined,
            Math.min(8, (duration * 180 * amount) / 2),
          );
        graphText(ctx, api, duration + ' s', 1760, y + 49, 30, themeColors.muted, 'right');
      }),
    );
    if (!serial)
      durations.forEach((duration, i) =>
        focusTarget(ctx, api, ['eval-read', 'health-read', 'policy-read'][i], () => {
          const y = 355 + i * 150,
            complete = elapsed >= duration,
            color = [themeColors.blue, themeColors.pink, themeColors.green][i];
          components.card({
            label: complete ? `${['eval', 'health', 'policy'][i]} · r17 / v3` : 'Receipt pending',
            x: 1185,
            y,
            width: 440,
            height: 72,
            fontSize: 27,
            fill: themeColors.panel,
            stroke: complete ? color : themeColors.muted,
            textColor: complete ? color : themeColors.muted,
            padding: 10,
          });
          if (complete) api.arrow(ctx, 500 + duration * 180 + 14, y + 36, 1163, y + 36, color, 3);
        }),
      );
    const mx = 500 + readEnd * 180,
      ma = clamp((elapsed - readEnd) / 0.5);
    focusTarget(ctx, api, 'merge-step', () => {
      graphText(ctx, api, 'Merge', 440, 835, 32, themeColors.cyan, 'right');
      api.rect(ctx, mx, 790, 0.5 * 180, 62, themeColors.panel, themeColors.muted, 8);
      if (ma > 0)
        api.rect(
          ctx,
          mx,
          790,
          0.5 * 180 * ma,
          62,
          themeColors.cyan,
          undefined,
          Math.min(8, (0.5 * 180 * ma) / 2),
        );
      graphText(ctx, api, '0.5 s', 1760, 835, 28, themeColors.cyan, 'right');
    });
    api.line(ctx, 500 + elapsed * 180, 320, 500 + elapsed * 180, 865, themeColors.yellow, 3);
    [0, 1, 2, 3, 4, 5, 6, 6.5].forEach((n) =>
      graphText(ctx, api, String(n), 500 + n * 180, 905, 28, themeColors.muted, 'center'),
    );
  }
}
export default {
  id: 'parallel-clock',
  draw: drawParallelClock,
  cues: [
    'serial-reads',
    'serial-comparison',
    'parallel-reads',
    'merge-overhead',
    'parallel-total',
    'same-total-work',
    'overhead',
  ],
};
