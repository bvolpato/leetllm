import { limit } from '../construction.mjs';
import { wilsonLower } from '../model.mjs';
import { box, constructionText, footer, line, title } from '../defaults.mjs';
export function drawConfidenceSelection(ctx, scene, state, api) {
  api.focus.target('confidence-selection-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    {
      title(
        ctx,
        api,
        currentBeat < 2
          ? 'Perfect observed success can still have weak lower-bound evidence'
          : 'The stronger predeclared rule changes the conditional plan',
      );
      if (currentBeat < 2) {
        const rows = [
          {
            n: 200,
            k: 200,
          },
          {
            n: 20,
            k: 20,
          },
          {
            n: 200,
            k: 190,
          },
        ];
        rows.forEach((r, i) => {
          const y = 435 + i * 175,
            lower = wilsonLower(r.k, r.n),
            x = (v) => 580 + v * 1030;
          constructionText(ctx, api, `${r.k}/${r.n}`, 230, y + 10, 33, themeColors.blue);
          line(ctx, api, x(0), y, x(1), y, themeColors.border, 2);
          line(ctx, api, x(lower), y, x(1), y, i === 0 ? themeColors.green : themeColors.red, 12);
          api.circle(ctx, x(lower), y, 10, i === 0 ? themeColors.green : themeColors.red);
          line(ctx, api, x(0.95), y - 30, x(0.95), y + 30, themeColors.yellow, 3);
          constructionText(
            ctx,
            api,
            `${(lower * 100).toFixed(1)}%`,
            x(lower) - 70,
            y + 60,
            28,
            i === 0 ? themeColors.green : themeColors.red,
            'center',
          );
        });
        footer(ctx, api, 'All-success shortcut: lower = n / (n + z²), z² ≈ 2.706');
      } else {
        const result = state.cues?.['confidence-fleet'];
        const changed = currentBeat > 2 || (result ? result.phase === 'after' : progress > 0.84);
        ['observed 95% rule', 'Wilson lower≥95%'].forEach((v, i) => {
          const x = 200 + i * 850;
          constructionText(
            ctx,
            api,
            v,
            x + 300,
            380,
            32,
            i ? themeColors.yellow : themeColors.cyan,
            'center',
          );
          box(
            ctx,
            api,
            i ? '1.0 RPS · 200/200' : '1.5 RPS · 190/200',
            x,
            450,
            650,
            90,
            i ? themeColors.yellow : themeColors.cyan,
            30,
          );
          constructionText(
            ctx,
            api,
            i ? '10 active / 3 ≈ 3.33' : '15 active / 3 = 5',
            x + 320,
            650,
            31,
            themeColors.ink,
            'center',
          );
          if (!i || changed)
            box(
              ctx,
              api,
              i ? '100 ÷ (10/3) = 30 replicas' : '100 ÷ 5 = 20 replicas',
              x,
              785,
              650,
              90,
              i ? themeColors.yellow : themeColors.cyan,
              29,
            );
        });
        footer(
          ctx,
          api,
          currentBeat === 3
            ? 'Correlated bursts require run/block analysis; selection needs fresh confirmation'
            : 'Planning assumption: the same 10-second mean still applies at 1.0 RPS',
        );
      }
    }
    return true;
  });
}
export default {
  id: 'confidence-selection',
  draw: drawConfidenceSelection,
  cues: [
    'confidence-selection-beat-0',
    'confidence-small',
    'confidence-selection-beat-1',
    'confidence-selection-beat-2',
    'confidence-fleet',
    'confidence-selection-beat-3',
  ],
};
