import { mix } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { box, caption, text as constructionText } from '../defaults.mjs';
export function drawShadowResource(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'shadow-resource'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-shadow-resource-mechanism', () => {
    if (B === 0) {
      constructionText(ctx, api, 'Live request', 180, 310, 32, themeColors.cyan);
      const p = cueProgress('shadow', 0);
      box(ctx, api, 'CONTROL', 200, 430, 510, 110, themeColors.blue, 35);
      box(ctx, api, 'User response', 1210, 430, 510, 110, themeColors.blue, 35);
      api.arrow(ctx, 740, 485, mix(750, 1180, p), 485, themeColors.blue, 6);
      box(ctx, api, 'CANDIDATE', 200, 720, 510, 110, themeColors.yellow, 35);
      api.arrow(ctx, 450, 570, 450, mix(580, 690, p), themeColors.yellow, 5);
      if (p === 1) {
        box(
          ctx,
          api,
          ['Shadow result', 'retained for comparison'],
          1190,
          720,
          550,
          110,
          themeColors.yellow,
          29,
        );
        api.arrow(ctx, 740, 775, 1160, 775, themeColors.yellow, 4);
      }
      if (resultComplete('canary', 0))
        constructionText(
          ctx,
          api,
          'Canary: a declared exposed subset',
          960,
          630,
          31,
          themeColors.cyan,
          'center',
        );
    }
    if (B === 1) {
      box(ctx, api, 'Candidate work', 220, 395, 550, 120, themeColors.yellow, 33);
      const effects = ['write tool', 'notification', 'purchase'];
      effects.forEach((v, i) =>
        box(
          ctx,
          api,
          v,
          1090,
          350 + i * 165,
          600,
          100,
          resultComplete('effects', 1) ? themeColors.muted : themeColors.pink,
          30,
        ),
      );
      if (resultComplete('effects', 1))
        effects.forEach((_, i) =>
          constructionText(
            ctx,
            api,
            'DISABLED',
            850,
            410 + i * 165,
            28,
            themeColors.pink,
            'center',
          ),
        );
      if (resultComplete('budget', 1))
        box(ctx, api, 'Separate bounded work budget', 200, 805, 670, 70, themeColors.cyan, 30);
    }
    if (B === 2) {
      box(
        ctx,
        api,
        ['A output cache', 'config + authorization'],
        220,
        365,
        660,
        115,
        themeColors.blue,
        31,
      );
      box(
        ctx,
        api,
        ['B output cache', 'config + authorization'],
        1040,
        365,
        660,
        115,
        themeColors.cyan,
        31,
      );
      box(
        ctx,
        api,
        ['Shared queue / GPU', 'possible interference'],
        500,
        680,
        920,
        120,
        resultComplete('interference', 2) ? themeColors.yellow : themeColors.muted,
        33,
      );
    }
    caption(
      ctx,
      api,
      'Shadow effects stay disabled; resource isolation mitigates shared-resource impact',
    );
  });
}
export default {
  id: 'shadow-resource',
  draw: drawShadowResource,
  cues: [
    'oa-shadow-resource-0',
    'oa-shadow-resource-shadow',
    'oa-shadow-resource-canary',
    'oa-shadow-resource-1',
    'oa-shadow-resource-effects',
    'oa-shadow-resource-budget',
    'oa-shadow-resource-2',
    'oa-shadow-resource-interference',
  ],
};
