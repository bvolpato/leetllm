import { betaDensity } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { box, caption, text as constructionText, line } from '../defaults.mjs';
export function drawPosteriorRouting(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'posterior-routing'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-posterior-routing-mechanism', () => {
    const updated = resultComplete('update', 1),
      final = resultComplete('raw', 1),
      models = final
        ? [
            {
              alpha: 89,
              beta: 64,
              pulls: 151,
            },
            {
              alpha: 227,
              beta: 124,
              pulls: 349,
            },
          ]
        : updated
          ? [
              {
                alpha: 1,
                beta: 1,
                pulls: 0,
              },
              {
                alpha: 2,
                beta: 1,
                pulls: 1,
              },
            ]
          : [
              {
                alpha: 1,
                beta: 1,
                pulls: 0,
              },
              {
                alpha: 1,
                beta: 1,
                pulls: 0,
              },
            ];
    const xx = (v) => 260 + 1400 * v,
      yy = (v) => 730 - (330 * Math.min(18, v)) / 18;
    line(ctx, api, 260, 730, 1660, 730, themeColors.muted, 3);
    for (const v of [0, 0.25, 0.5, 0.75, 1])
      constructionText(ctx, api, v, xx(v), 775, 27, themeColors.muted, 'center');
    models.forEach((m, i) => {
      api.path(
        ctx,
        Array.from(
          {
            length: 301,
          },
          (_, j) => ({
            x: xx(j / 300),
            y: yy(betaDensity(j / 300, m.alpha, m.beta)),
          }),
        ),
        {
          color: i ? themeColors.cyan : themeColors.blue,
          width: 5,
        },
      );
      box(
        ctx,
        api,
        `${i ? 'B' : 'A'}: Beta(${m.alpha}, ${m.beta})`,
        200 + i * 850,
        310,
        800,
        80,
        i ? themeColors.cyan : themeColors.blue,
        32,
      );
    });
    if (B === 0 && cueProgress('sample', 0) > 0) {
      const q = cueProgress('sample', 0);
      box(
        ctx,
        api,
        ['Illustrative sampled rates', 'A .40 · B .70 → select B'],
        530,
        830,
        860,
        95,
        themeColors.yellow,
        30,
      );
      if (q === 1)
        constructionText(
          ctx,
          api,
          'B reward observed: 1',
          1280,
          660,
          29,
          themeColors.yellow,
          'center',
        );
    }
    if (B === 1 && !final)
      box(
        ctx,
        api,
        updated
          ? ['One illustrative update: B reward 1', 'A unchanged; B α: 1 → 2']
          : ['Selected B reward: 1', 'Posterior update pending'],
        520,
        830,
        880,
        95,
        themeColors.yellow,
        30,
      );
    if (final && B === 1)
      box(
        ctx,
        api,
        ['Exact source run · A 151 pulls / 88 raw successes', 'B 349 pulls / 226 raw successes'],
        300,
        825,
        1320,
        100,
        themeColors.green,
        31,
      );
    if (B === 2)
      box(
        ctx,
        api,
        ['True .55 / .62 are simulation inputs', 'Delayed reward stays pending until observed'],
        340,
        825,
        1240,
        110,
        themeColors.yellow,
        31,
      );
    caption(ctx, api, 'Beta density uses one common 0–1 rate axis and fixed density scale');
  });
}
export default {
  id: 'posterior-routing',
  draw: drawPosteriorRouting,
  cues: [
    'oa-posterior-routing-0',
    'oa-posterior-routing-prior',
    'oa-posterior-routing-sample',
    'oa-posterior-routing-1',
    'oa-posterior-routing-update',
    'oa-posterior-routing-pulls',
    'oa-posterior-routing-raw',
    'oa-posterior-routing-2',
    'oa-posterior-routing-delayed',
  ],
};
