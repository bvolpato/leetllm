import { clamp, mix } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { PersistedExperiment } from '../model.mjs';
import { box, caption, text as constructionText, proportionBar } from '../defaults.mjs';
export function drawRouterRamp(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'router-ramp'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-router-ramp-mechanism', () => {
    const router = new PersistedExperiment(),
      r = router.assign('docs-prompt-v1', 'thread-7', 0.1);
    if (B === 0) {
      constructionText(
        ctx,
        api,
        'Compact tuple: ["docs-prompt-v1","thread-7"]',
        190,
        310,
        32,
        themeColors.cyan,
      );
      const h = cueProgress('hash', 0);
      box(ctx, api, ['SHA-256', 'first 64 bits'], 210, 400, 500, 130, themeColors.blue, 32);
      api.arrow(ctx, 740, 465, mix(750, 1020, h), 465, themeColors.cyan, 5);
      box(
        ctx,
        api,
        resultComplete('bucket', 0)
          ? ['bucket fraction', r.fraction.toFixed(6)]
          : ['bucket fraction', 'pending'],
        1060,
        400,
        650,
        130,
        themeColors.cyan,
        32,
      );
    }
    const stored = resultComplete('store', 0);
    proportionBar(
      ctx,
      api,
      'Enrollment threshold',
      B === 0 ? 0.1 : 0.5,
      230,
      620,
      1200,
      themeColors.yellow,
    );
    if (stored)
      box(
        ctx,
        api,
        ['Stored assignment', 'thread-7 → CONTROL'],
        200,
        760,
        660,
        105,
        themeColors.blue,
        32,
      );
    if (B >= 1) {
      const p = cueProgress('persist', 1),
        turns = N(3, p);
      for (let i = 0; i < 3; i++)
        box(
          ctx,
          api,
          ['turn ' + (i + 2), i < turns ? 'read stored C' : 'pending'],
          210 + i * 550,
          380,
          500,
          135,
          i < turns ? themeColors.blue : themeColors.muted,
          30,
        );
      if (B === 2 && resultComplete('fallback', 2)) {
        box(
          ctx,
          api,
          ['assigned C: unchanged', 'served version: fallback'],
          1040,
          760,
          660,
          105,
          themeColors.yellow,
          29,
        );
      }
    }
    caption(
      ctx,
      api,
      'Enrollment thresholds affect new keys; existing conversation assignment stays fixed',
    );
  });
}
export default {
  id: 'router-ramp',
  draw: drawRouterRamp,
  cues: [
    'oa-router-ramp-0',
    'oa-router-ramp-hash',
    'oa-router-ramp-bucket',
    'oa-router-ramp-store',
    'oa-router-ramp-1',
    'oa-router-ramp-persist',
    'oa-router-ramp-2',
    'oa-router-ramp-fallback',
  ],
};
