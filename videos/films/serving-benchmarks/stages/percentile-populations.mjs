import { cueStarted, limit } from '../construction.mjs';
import { box, constructionText, footer, line, title } from '../defaults.mjs';
export function drawPercentilePopulations(ctx, scene, state, api) {
  api.focus.target('percentile-populations-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    const beg = (name, fallback = progress > 0.4) => cueStarted(state.cues, name, fallback);
    {
      title(ctx, api, 'A percentile is an order statistic of a named population');
      if (currentBeat === 0) {
        for (let i = 0; i < 20; i++) {
          const x = 220 + i * 77;
          api.rect(
            ctx,
            x,
            560,
            57,
            70,
            i === 18 ? themeColors.yellow : themeColors.blue,
            undefined,
            3,
          );
          constructionText(
            ctx,
            api,
            String(i + 1),
            x + 28,
            680,
            24,
            i === 18 ? themeColors.yellow : themeColors.muted,
            'center',
          );
        }
        box(ctx, api, 'p95 rank = ceil(.95 × 20) = 19', 430, 810, 1060, 85, themeColors.yellow, 35);
        footer(ctx, api, 'For n=80, p99 selects rank80: the maximum');
      } else {
        const pooled = [...Array(19).fill(1), 100];
        constructionText(ctx, api, 'A: nineteen 1 ms gaps', 220, 380, 30, themeColors.cyan);
        constructionText(ctx, api, 'B: one 100 ms gap', 1260, 380, 30, themeColors.pink);
        for (let i = 0; i < 20; i++) {
          const x = 220 + i * 77,
            y = 660,
            h = pooled[i];
          api.rect(
            ctx,
            x,
            y - h * 2.2,
            52,
            h * 2.2,
            i === 19 ? themeColors.pink : themeColors.cyan,
            undefined,
            0,
          );
          constructionText(
            ctx,
            api,
            String(pooled[i]),
            x + 26,
            710,
            23,
            i === 19 ? themeColors.pink : themeColors.cyan,
            'center',
          );
          if (i === 18 && beg('percentile-pooled', progress > 0.3))
            line(ctx, api, x, 770, x, 800, themeColors.yellow, 5);
        }
        if (currentBeat > 1 || beg('percentile-pooled', progress > 0.3))
          box(ctx, api, 'pooled p95 = 1 ms', 220, 820, 650, 80, themeColors.cyan, 31);
        if (currentBeat > 1 || beg('percentile-per-request', progress > 0.6))
          box(
            ctx,
            api,
            'per-request worst: [1,100] → p95 = 100 ms',
            970,
            820,
            760,
            80,
            themeColors.pink,
            29,
          );
        footer(
          ctx,
          api,
          currentBeat === 2
            ? 'Mean of these summaries = 50.5 ms; it reconstructs neither distribution'
            : 'Twenty gap observations versus two request observations',
        );
      }
    }
    return true;
  });
}
export default {
  id: 'percentile-populations',
  draw: drawPercentilePopulations,
  cues: [
    'percentile-populations-beat-0',
    'percentile-populations-beat-1',
    'percentile-pooled',
    'percentile-per-request',
    'percentile-populations-beat-2',
  ],
};
