import { clamp } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { box, caption, chip, text as constructionText, line } from '../defaults.mjs';
export function drawTreatmentIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'treatment-identity'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-treatment-identity-mechanism', () => {
    const bundle = resultComplete('bundle', 0),
      factorial = cueProgress('factorial', 0);
    constructionText(ctx, api, 'Registered treatment', 180, 285, 32, themeColors.cyan);
    box(ctx, api, ['A', 'model M0 + prompt P0'], 180, 345, 630, 135, themeColors.blue, 31);
    box(ctx, api, ['B', 'model M1 + prompt P1'], 1110, 345, 630, 135, themeColors.cyan, 31);
    if (bundle && B < 2)
      box(ctx, api, 'Combined bundle effect', 690, 555, 540, 95, themeColors.yellow, 32);
    if (factorial > 0 && B === 0) {
      const cells = [
        ['M0 / P0', 0, 0],
        ['M0 / P1', 1, 0],
        ['M1 / P0', 0, 1],
        ['M1 / P1', 1, 1],
      ];
      cells
        .slice(0, N(4, factorial))
        .forEach(([v, x, y]) =>
          box(ctx, api, v, 650 + x * 320, 690 + y * 90, 290, 75, themeColors.muted, 28),
        );
    }
    if (B === 1) {
      const pins = [
        'weights + quantization',
        'prompt + sampler',
        'output budget',
        'engine + scheduler',
        'retrieval + tools',
      ];
      pins
        .slice(0, N(5, cueProgress('pins', 1)))
        .forEach((v, i) =>
          chip(
            ctx,
            api,
            v,
            175 + (i % 3) * 550,
            665 + Math.floor(i / 3) * 100,
            500,
            i < 2 ? themeColors.cyan : themeColors.yellow,
          ),
        );
    }
    if (B === 2) {
      constructionText(ctx, api, 'Eligible conversation', 220, 635, 31, themeColors.cyan);
      line(ctx, api, 250, 720, 1660, 720, themeColors.muted, 4);
      for (const [x, label] of [
        [280, 'enroll'],
        [1650, '24-hour cutoff'],
      ]) {
        line(ctx, api, x, 705, x, 735, themeColors.cyan, 4);
        constructionText(ctx, api, label, x, 780, 28, themeColors.muted, 'center');
      }
      if (resultComplete('outcome', 2))
        box(
          ctx,
          api,
          ['explicit resolution', 'AND no escalation inside window'],
          650,
          590,
          660,
          100,
          themeColors.green,
          28,
        );
    }
    caption(
      ctx,
      api,
      B === 2
        ? 'Citation clicks remain secondary actions'
        : 'One changed component or a preplanned factorial design earns component attribution',
    );
  });
}
export default {
  id: 'treatment-identity',
  draw: drawTreatmentIdentity,
  cues: [
    'oa-treatment-identity-0',
    'oa-treatment-identity-bundle',
    'oa-treatment-identity-factorial',
    'oa-treatment-identity-1',
    'oa-treatment-identity-pins',
    'oa-treatment-identity-2',
    'oa-treatment-identity-outcome',
  ],
};
