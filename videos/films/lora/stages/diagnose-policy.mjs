import { text, rect } from '../defaults.mjs';
export function drawDiagnosePolicy(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress2, start, end);
  ctx.save();
  {
    api.focus.target('diagnose-policy-mechanism', () => {
      const inspect = api.focus.progress('diagnose-path', stage(1, 0.1, 0.45));
      const overfit = api.focus.progress('diagnose-overfit', stage(1, 0.55, 0.85));
      text(
        ctx,
        api,
        'ONE CONTROLLED EXPERIMENT · same supervised tokens and evaluation cases',
        190,
        280,
        29,
        themeColors.muted,
      );
      if (beat === 0) {
        const rows = [
          ['rank', '8', '16'],
          ['learning rate', '1e−4', '2e−4'],
          ['dropout', '0', '0.05'],
          ['targets', 'Q + V', 'all-linear'],
        ];
        for (const [i, row] of rows.entries()) {
          const y = 410 + i * 130;
          text(ctx, api, row[0], 190, y, 34, themeColors.muted);
          rect(ctx, api, 740, y - 50, 300, 85, themeColors.panel, themeColors.yellow);
          text(ctx, api, row[1], 890, y + 5, 36, themeColors.yellow, 'center', 'mono');
          rect(ctx, api, 1300, y - 50, 300, 85, themeColors.panel, themeColors.cyan);
          text(ctx, api, row[2], 1450, y + 5, 36, themeColors.cyan, 'center', 'mono');
        }
        text(
          ctx,
          api,
          'Compare one setting at a time. For the rank comparison, hold the scale fixed.',
          190,
          1000,
          31,
          themeColors.muted,
        );
      } else {
        const plot = api.teaching.axes({
          x: 190,
          y: 390,
          width: 650,
          height: 480,
          xDomain: [0, 1],
          yDomain: [0, 1],
          xTicks: [0, 1],
          yTicks: [0, 1],
          fontSize: 24,
        });
        const curve = (fn, color, progress = 1) =>
          api.trace(
            ctx,
            Array.from(
              {
                length: 51,
              },
              (_, i) => plot.point(i / 50, fn(i / 50)),
            ),
            progress,
            color,
            4,
          );
        if (overfit === 0 && beat === 1) {
          curve(() => 0.65, themeColors.blue);
          text(ctx, api, 'flat training loss', 190, 335, 30, themeColors.blue);
        } else {
          curve((t) => 0.8 - 0.6 * t, themeColors.blue, overfit || 1);
          curve((t) => 0.65 - 0.2 * t + 0.45 * t * t, themeColors.pink, overfit || 1);
          text(
            ctx,
            api,
            'schematic: train improves / held-out worsens',
            190,
            335,
            28,
            themeColors.muted,
          );
        }
        const checks = [
          'formatting + supervised masks',
          'actual targets + nonzero gradients',
          'scale + data + regularization',
        ];
        for (const [i, s] of checks.entries()) {
          const active = inspect >= (i + 1) / 3 || beat === 2;
          rect(
            ctx,
            api,
            1000,
            390 + i * 140,
            740,
            85,
            themeColors.panel,
            active ? themeColors.yellow : themeColors.muted,
          );
          text(
            ctx,
            api,
            s,
            1030,
            445 + i * 140,
            29,
            active ? themeColors.yellow : themeColors.muted,
          );
        }
        if (beat === 2) {
          text(ctx, api, 'task / regression / validation loss', 1000, 875, 30, themeColors.green);
          text(
            ctx,
            api,
            'peak memory / latency / artifact identity',
            1000,
            950,
            28,
            themeColors.muted,
          );
          text(
            ctx,
            api,
            'Check which weights can change the failing reply.',
            190,
            1015,
            30,
            themeColors.muted,
          );
        }
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'diagnose-policy',
  draw: drawDiagnosePolicy,
  cues: [
    'diagnose-policy-1',
    'diagnose-policy-2',
    'diagnose-path',
    'diagnose-overfit',
    'diagnose-policy-3',
  ],
};
