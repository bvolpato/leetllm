import { limit } from '../construction.mjs';
import { wilsonLower } from '../model.mjs';
import { constructionText, footer, line, timeAxis, title } from '../defaults.mjs';
export function drawUncertaintyAndQuality(ctx, scene, state, api) {
  api.focus.target('uncertainty-and-quality-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    {
      title(ctx, api, '190 of 200 is an observed fraction, with sampling uncertainty');
      api.focus.target('quality-observed-population', () => {
        for (let i = 0; i < 200; i++) {
          const x = 230 + (i % 40) * 36,
            y = 390 + Math.floor(i / 40) * 48;
          api.rect(ctx, x, y, 25, 32, i < 190 ? themeColors.green : themeColors.red, undefined, 0);
        }
      });
      api.focus.target('uncertainty-and-quality-math-95', () =>
        constructionText(
          ctx,
          api,
          '190 qualified / 200 offered = 95%',
          960,
          730,
          35,
          themeColors.green,
          'center',
        ),
      );
      const x = (v) => 260 + v * 1400;
      timeAxis(ctx, api, 260, 850, 1400, 1, [0, 0.25, 0.5, 0.75, 1]);
      const floor = 0.95,
        lower = wilsonLower(190, 200);
      api.focus.target('quality-required-floor', () => {
        line(ctx, api, x(floor), 785, x(floor), 910, themeColors.yellow, 4);
        constructionText(
          ctx,
          api,
          'required .95',
          x(floor) - 150,
          955,
          27,
          themeColors.yellow,
          'center',
        );
      });
      if (currentBeat >= 1)
        api.focus.target('quality-lower-bound', () => {
          line(ctx, api, x(lower), 850, x(1), 850, themeColors.cyan, 9);
          api.circle(ctx, x(lower), 850, 11, themeColors.cyan);
          constructionText(
            ctx,
            api,
            `lower ${(lower * 100).toFixed(1)}%`,
            x(lower) - 220,
            795,
            29,
            themeColors.cyan,
            'center',
          );
        });
      footer(
        ctx,
        api,
        'One-sided 95% Wilson procedure assumes independent constant-probability trials',
      );
    }
    return true;
  });
}
export default {
  id: 'uncertainty-and-quality',
  draw: drawUncertaintyAndQuality,
  cues: [
    'quality-observed-attainment',
    'quality-wilson-bound',
    'quality-fails-floor',
    'quality-population',
    'quality-qualification',
  ],
};
