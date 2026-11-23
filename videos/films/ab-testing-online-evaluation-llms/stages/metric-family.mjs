import { clamp } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { adjustedFamily } from '../model.mjs';
import { box, caption, text as constructionText } from '../defaults.mjs';
export function drawMetricFamily(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'metric-family'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-metric-family-mechanism', () => {
    const values = [0.001, 0.02, 0.12, 0.42],
      r = adjustedFamily(values);
    if (B === 0) {
      const q = cueProgress('family', 0),
        n = Math.max(1, N(20, q));
      for (let i = 0; i < 20; i++)
        box(
          ctx,
          api,
          'test ' + (i + 1),
          190 + (i % 5) * 325,
          330 + Math.floor(i / 5) * 110,
          290,
          80,
          i < n ? themeColors.cyan : themeColors.muted,
          27,
        );
      if (q === 1)
        constructionText(
          ctx,
          api,
          '1 − 0.95²⁰ = ' + (100 * (1 - 0.95 ** 20)).toFixed(1) + '%',
          960,
          870,
          44,
          themeColors.yellow,
          'center',
        );
    } else {
      const headings = ['Metric', 'Raw p', '× 4 / rank', 'BH reverse min', 'Bonferroni'];
      headings.forEach((v, i) =>
        constructionText(
          ctx,
          api,
          v,
          [200, 500, 810, 1190, 1600][i],
          320,
          28,
          themeColors.muted,
          'center',
        ),
      );
      r.sorted.forEach((row, i) => {
        const y = 430 + i * 115;
        constructionText(ctx, api, 'M' + (row.id + 1), 200, y, 32, themeColors.cyan, 'center');
        constructionText(ctx, api, row.p.toFixed(3), 500, y, 32);
        if (cueProgress('sort', 1) > i / 4)
          constructionText(ctx, api, row.rankScaled.toFixed(3), 810, y, 32, themeColors.yellow);
        if (resultComplete('min', 1))
          constructionText(ctx, api, row.adjusted.toFixed(3), 1190, y, 34, themeColors.cyan);
        if (resultComplete('bonf', 1))
          constructionText(
            ctx,
            api,
            r.bonferroni[row.id].toFixed(3),
            1600,
            y,
            34,
            themeColors.blue,
          );
      });
      if (resultComplete('second', 2))
        box(
          ctx,
          api,
          'M2: BH .040 passes · Bonferroni .080 does not',
          300,
          870,
          1320,
          70,
          themeColors.yellow,
          32,
        );
    }
    caption(
      ctx,
      api,
      'Familywise error and expected false-discovery proportion answer different questions',
    );
  });
}
export default {
  id: 'metric-family',
  draw: drawMetricFamily,
  cues: [
    'oa-metric-family-0',
    'oa-metric-family-family',
    'oa-metric-family-1',
    'oa-metric-family-bonf',
    'oa-metric-family-sort',
    'oa-metric-family-min',
    'oa-metric-family-2',
    'oa-metric-family-values',
    'oa-metric-family-second',
  ],
};
