import { budgetSnapshot } from '../model.mjs';
import { box, focus, math, text } from '../defaults.mjs';
export function drawWorkBudget(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = budgetSnapshot(state);
    focus(ctx, api, themeColors, 'budget-work', () => {
      box(
        ctx,
        api,
        themeColors,
        s.n.toLocaleString() + ' eligible candidates',
        160,
        315,
        660,
        110,
        themeColors.blue,
        39,
      );
      box(ctx, api, themeColors, '384 coordinates', 1070, 315, 660, 110, themeColors.cyan, 39);
      math(
        ctx,
        api,
        themeColors,
        s.count === 1
          ? String.raw`${s.n}\times384=${s.products.toLocaleString()}`
          : String.raw`${s.n}\times384=\;?`,
        960,
        570,
        58,
        themeColors.yellow,
      );
      text(
        ctx,
        api,
        themeColors,
        'Score-stage budget: 1,000,000 products',
        960,
        710,
        38,
        themeColors.ink,
      );
      box(
        ctx,
        api,
        themeColors,
        s.check === 1
          ? s.within
            ? 'Within budget: release exact scoring'
            : 'Over budget: reroute before scoring'
          : 'Decision pending',
        350,
        810,
        1220,
        100,
        s.check === 1 ? (s.within ? themeColors.green : themeColors.pink) : themeColors.muted,
        39,
      );
      text(
        ctx,
        api,
        themeColors,
        s.check === 1
          ? s.within
            ? 'Exact-score pass enabled after the guard'
            : 'Exact-score pass held: zero products executed'
          : 'Exact-score pass held pending the guard',
        960,
        1000,
        32,
        s.run ? themeColors.cyan : themeColors.muted,
      );
    });
    focus(ctx, api, themeColors, 'budget-winners', () => {
      if (beat === 1) {
        text(ctx, api, themeColors, 'Retained output slots', 1490, 215, 29, themeColors.muted);
        for (let i = 0; i < s.k; i++)
          box(
            ctx,
            api,
            themeColors,
            String(i + 1),
            1390 + i * 150,
            225,
            115,
            60,
            themeColors.yellow,
            29,
          );
      }
    });
  }
}
export default {
  id: 'work-budget',
  draw: drawWorkBudget,
  cues: ['budget-count', 'budget-check', 'budget-run', 'budget-k', 'budget-over', 'budget-stop'],
};
