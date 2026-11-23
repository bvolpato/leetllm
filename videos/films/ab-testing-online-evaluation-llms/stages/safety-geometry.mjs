import { mix } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { axis, box, text as constructionText, line } from '../defaults.mjs';
export function drawSafetyGeometry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'safety-geometry'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-safety-geometry-mechanism', () => {
    if (B < 2) {
      const x = axis(
        ctx,
        api,
        270,
        610,
        1380,
        -0.15,
        0.05,
        [-0.15, -0.1, -0.05, 0, 0.05],
        'Safety-pass-rate difference · percentage points',
      );
      line(ctx, api, x(-0.05), 350, x(-0.05), 585, themeColors.yellow, 4);
      constructionText(
        ctx,
        api,
        'Tolerated harm −0.05',
        x(-0.05),
        300,
        30,
        themeColors.yellow,
        'center',
      );
      if (cueProgress('interval', 0) > 0) {
        const p = cueProgress('interval', 0);
        line(ctx, api, x(-0.12), 480, mix(x(-0.12), x(0.02), p), 480, themeColors.cyan, 12);
        if (p === 1) {
          constructionText(ctx, api, '−0.12', x(-0.12), 420, 32, themeColors.pink, 'center');
          constructionText(ctx, api, '+0.02', x(0.02), 420, 32, themeColors.cyan, 'center');
        }
      }
      const outside = cueProgress('hold', 0);
      if (outside > 0)
        line(ctx, api, x(-0.05), 480, mix(x(-0.05), x(-0.12), outside), 480, themeColors.pink, 12);
      if (resultComplete('hold', 0))
        box(
          ctx,
          api,
          'Hold  ·  the interval allows a larger loss',
          360,
          790,
          1200,
          90,
          themeColors.pink,
          35,
        );
    }
    if (B === 2) {
      constructionText(
        ctx,
        api,
        'Independent absolute service requirement',
        960,
        350,
        34,
        themeColors.yellow,
        'center',
      );
      const t = cueProgress('clock', 2);
      const x = (seconds) => 340 + 300 * seconds;
      line(ctx, api, x(3), 434, x(3), 727, themeColors.yellow, 5);
      constructionText(ctx, api, '3 s deadline', x(3), 414, 34, themeColors.yellow, 'center');
      ['A', 'B'].forEach((arm, i) => {
        const y = 516 + i * 156;
        const color = i ? themeColors.cyan : themeColors.blue;
        constructionText(ctx, api, arm, 230, y + 15, 42, color);
        line(ctx, api, x(0), y, x(4), y, themeColors.border, 4);
        if (t > 0) line(ctx, api, x(0), y, x(3.5 * t), y, color, 16);
        if (t === 1) constructionText(ctx, api, '3.5 s', x(3.5) + 35, y - 28, 37, color);
      });
      if (resultComplete('absolute', 2))
        constructionText(
          ctx,
          api,
          'B − A = 0 s  ·  both miss the deadline by 0.5 s',
          960,
          840,
          36,
          themeColors.pink,
          'center',
        );
    }
  });
}
export default {
  id: 'safety-geometry',
  draw: drawSafetyGeometry,
  cues: [
    'oa-safety-geometry-0',
    'oa-safety-geometry-interval',
    'oa-safety-geometry-hold',
    'oa-safety-geometry-1',
    'oa-safety-geometry-margin',
    'oa-safety-geometry-2',
    'oa-safety-geometry-clock',
    'oa-safety-geometry-absolute',
  ],
};
