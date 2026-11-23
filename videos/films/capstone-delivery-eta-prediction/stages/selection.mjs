import { decisions } from '../model.mjs';
import { sum } from '../arithmetic.mjs';
import { retainedDrawText } from '../defaults.mjs';
export function drawSelection(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const threshold = Number(
    (
      0.4 +
      0.19 * api.focus.progress('sweep-first', 0) +
      0.06 * api.focus.progress('sweep-standard', 0) +
      0.15 * api.focus.progress('sweep-finish', 0)
    ).toFixed(2),
  );
  const rows = decisions(threshold);
  const penalty = sum(rows.map((row) => row.penalty));
  {
    retainedDrawText(
      ctx,
      api,
      'Warn when the score reaches the yellow cutoff',
      960,
      275,
      34,
      themeColors.ink,
      'center',
    );
    const x = (risk) => 480 + risk * 820;
    const thresholdX = x(threshold);
    rows.forEach((_, i) => {
      const y = 390 + i * 120;
      api.focus.target('threshold', () =>
        api.line(ctx, thresholdX, y - 15, thresholdX, y + 24, themeColors.yellow, 4),
      );
    });
    rows.forEach((row, i) => {
      const y = 390 + i * 120;
      retainedDrawText(
        ctx,
        api,
        row.id,
        150,
        y + 10,
        28,
        row.late ? themeColors.pink : themeColors.muted,
      );
      api.line(ctx, x(0), y, x(1), y, themeColors.muted, 2);
      api.focus.target('risk-cases', () =>
        api.circle(ctx, x(row.risk), y, 14, row.warn ? themeColors.yellow : themeColors.blue),
      );
      api.focus.target('risk-cases', () =>
        retainedDrawText(
          ctx,
          api,
          Math.round(100 * row.risk) + '%',
          x(row.risk),
          y - 28,
          25,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('decisions', () =>
        retainedDrawText(
          ctx,
          api,
          row.warn ? 'WARN' : 'TRACK',
          1400,
          y + 10,
          28,
          row.warn ? themeColors.yellow : themeColors.blue,
        ),
      );
      api.focus.target('penalties', () =>
        retainedDrawText(
          ctx,
          api,
          'Penalty ' + row.penalty,
          1590,
          y + 10,
          26,
          row.penalty ? themeColors.pink : themeColors.green,
        ),
      );
    });
    api.focus.target('policy-tradeoff', () => {
      retainedDrawText(
        ctx,
        api,
        'Warn at ' + Math.round(100 * threshold) + '%',
        630,
        898,
        47,
        themeColors.yellow,
        'center',
      );
      retainedDrawText(
        ctx,
        api,
        'Total penalty: ' + penalty,
        1250,
        898,
        47,
        themeColors.ink,
        'center',
      );
    });
    retainedDrawText(
      ctx,
      api,
      'Assumed costs   /   False warning 8   /   Missed standard 60   /   Missed expedited 150',
      960,
      1010,
      26,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'selection',
  draw: drawSelection,
  cues: ['sweep-first', 'sweep-standard', 'sweep-finish'],
};
