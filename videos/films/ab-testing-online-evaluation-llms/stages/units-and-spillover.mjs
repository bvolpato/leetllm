import { clamp, mix } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { box, caption, text as constructionText, line } from '../defaults.mjs';
export function drawUnitsAndSpillover(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'units-and-spillover'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-units-and-spillover-mechanism', () => {
    if (B === 0) {
      const p = cueProgress('units', 0);
      constructionText(ctx, api, 'One assigned user', 250, 300, 33, themeColors.cyan);
      box(ctx, api, 'U1', 200, 380, 300, 110, themeColors.blue, 34);
      box(ctx, api, 'U2', 200, 680, 300, 110, themeColors.cyan, 34);
      const n = 1 + N(3, p);
      for (let i = 0; i < n; i++) {
        box(ctx, api, 'conversation ' + (i + 1), 730 + i * 245, 390, 210, 85, themeColors.blue, 25);
      }
      box(ctx, api, 'conversation 1', 730, 690, 210, 85, themeColors.cyan, 25);
      if (resultComplete('weighting', 0))
        box(
          ctx,
          api,
          ['User weight: ½ each', 'Conversation weights: 4/5 versus 1/5'],
          750,
          810,
          930,
          95,
          themeColors.yellow,
          29,
        );
    }
    if (B >= 1) {
      box(ctx, api, ['User A', 'assigned A'], 250, 390, 390, 125, themeColors.blue, 32);
      box(ctx, api, ['User B', 'assigned B'], 1280, 390, 390, 125, themeColors.cyan, 32);
      box(ctx, api, 'Shared collaborative document', 650, 650, 620, 120, themeColors.yellow, 31);
      const q = cueProgress('document', 1);
      line(ctx, api, 445, 545, 445, 605, themeColors.blue, 5);
      line(ctx, api, 445, 605, mix(445, 800, q), 605, themeColors.blue, 5);
      line(ctx, api, 1475, 545, 1475, 605, themeColors.cyan, 5);
      line(ctx, api, 1475, 605, mix(1475, 1120, q), 605, themeColors.cyan, 5);
      if (q === 1) {
        api.arrow(ctx, 800, 610, 800, 632, themeColors.blue, 4);
        api.arrow(ctx, 1120, 610, 1120, 632, themeColors.cyan, 4);
      }
      if (resultComplete('cluster', 1)) {
        api.rect(ctx, 205, 340, 1510, 480, null, themeColors.green, 12);
        constructionText(
          ctx,
          api,
          'Assign the interacting cluster together',
          960,
          860,
          34,
          themeColors.green,
          'center',
        );
      }
    }
    caption(
      ctx,
      api,
      B === 2
        ? 'Register required cohorts and preserve pre-treatment membership'
        : 'The inference must respect repeated users and the interaction boundary',
    );
  });
}
export default {
  id: 'units-and-spillover',
  draw: drawUnitsAndSpillover,
  cues: [
    'oa-units-and-spillover-0',
    'oa-units-and-spillover-units',
    'oa-units-and-spillover-weighting',
    'oa-units-and-spillover-1',
    'oa-units-and-spillover-document',
    'oa-units-and-spillover-cluster',
    'oa-units-and-spillover-2',
  ],
};
