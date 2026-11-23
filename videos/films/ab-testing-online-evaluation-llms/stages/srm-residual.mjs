import { onlineCueProgress } from '../construction.mjs';
import { assignmentResidual } from '../model.mjs';
import { box, caption, text as constructionText } from '../defaults.mjs';
export function drawSrmResidual(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'srm-residual'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-srm-residual-mechanism', () => {
    const r = assignmentResidual(5250, 4750),
      rows = ['Control', 'Treatment'];
    ['Arm', 'Observed', 'Expected', 'Residual', 'r² / expected'].forEach((v, i) =>
      constructionText(
        ctx,
        api,
        v,
        [225, 590, 940, 1260, 1600][i],
        330,
        29,
        themeColors.muted,
        'center',
      ),
    );
    rows.forEach((v, i) => {
      const y = 460 + i * 150;
      constructionText(ctx, api, v, 225, y, 32, i ? themeColors.cyan : themeColors.blue, 'center');
      constructionText(ctx, api, r.observed[i], 590, y, 34);
      if (resultComplete('expected', 0))
        constructionText(ctx, api, r.expected[i], 940, y, 34, themeColors.cyan);
      if (resultComplete('residual', 1))
        constructionText(ctx, api, (i ? '−' : '+') + '250', 1260, y, 34, themeColors.yellow);
      if (resultComplete('total', 1))
        constructionText(ctx, api, r.contributions[i].toFixed(1), 1600, y, 34, themeColors.yellow);
    });
    if (resultComplete('total', 1))
      box(ctx, api, '12.5 + 12.5 = χ² 25', 500, 700, 920, 90, themeColors.cyan, 38);
    if (B === 1 && resultComplete('tail', 1))
      constructionText(
        ctx,
        api,
        'erfc(√(25 / 2)) ≈ 5.73 × 10⁻⁷',
        960,
        850,
        38,
        themeColors.pink,
        'center',
      );
    if (resultComplete('diagnostic', 2))
      box(
        ctx,
        api,
        '25 > 10.83 → investigate assignments',
        430,
        830,
        1060,
        75,
        themeColors.yellow,
        33,
      );
    caption(
      ctx,
      api,
      'A diagnostic crossing does not identify the cause or prove an outcome effect',
    );
  });
}
export default {
  id: 'srm-residual',
  draw: drawSrmResidual,
  cues: [
    'oa-srm-residual-0',
    'oa-srm-residual-expected',
    'oa-srm-residual-square',
    'oa-srm-residual-1',
    'oa-srm-residual-residual',
    'oa-srm-residual-total',
    'oa-srm-residual-tail',
    'oa-srm-residual-2',
    'oa-srm-residual-diagnostic',
  ],
};
