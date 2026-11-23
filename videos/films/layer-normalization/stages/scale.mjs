import { scaleProgress, scaleTrace } from '../model.mjs';
import { equation, featureChart, text } from '../defaults.mjs';
export function drawScale(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    fade = components.fade;
  {
    const trace = scaleTrace(scaleProgress(progress, state)),
      vals = trace.values;
    api.focus.target('normalized-feature-pattern', () =>
      featureChart(ctx, api, vals, themeColors.green),
    );
    text(
      ctx,
      api,
      `Centered squares · ${trace.termCount} / 4`,
      1500,
      350,
      29,
      themeColors.muted,
      'center',
    );
    trace.squares.forEach((square, index) => {
      const shown = index < trace.termCount;
      api.focus.target('centered-square-' + index, () =>
        components.card({
          label: shown ? String(square) : '·',
          x: 1260 + index * 120,
          y: 395,
          width: 98,
          height: 62,
          fill: themeColors.panel,
          stroke: shown ? themeColors.yellow : themeColors.muted,
          textColor: shown ? themeColors.yellow : themeColors.muted,
          fontSize: 29,
          padding: 8,
        }),
      );
    });
    text(
      ctx,
      api,
      `Sum of squares   ${trace.squareSum}`,
      1500,
      500,
      27,
      themeColors.yellow,
      'center',
    );
    if (trace.variance !== null) {
      api.focus.target('population-variance', () =>
        equation(
          ctx,
          api,
          String.raw`\sigma^2=\frac{${trace.squareSum}}{4}=${trace.variance}`,
          1500,
          570,
          41,
          themeColors.yellow,
          'center',
        ),
      );
    }
    api.focus.target('normalization-divisor', () =>
      text(
        ctx,
        api,
        trace.divisor === null
          ? 'Divisor   ?'
          : `√(5 + 0.00001) ≈ ${trace.divisor.toFixed(3)}`,
        1500,
        650,
        32,
        themeColors.green,
        'center',
      ),
    );
    text(
      ctx,
      api,
      `Features divided · ${trace.appliedCount} / 4`,
      1500,
      715,
      30,
      themeColors.cyan,
      'center',
    );
    equation(
      ctx,
      api,
      String.raw`\hat x_i=\frac{x_i-\mu}{\sqrt{\sigma^2+\epsilon}}`,
      1500,
      790,
      46,
      themeColors.ink,
      'center',
    );
    if (currentBeat === 1) {
      const epsilonReveal = api.phase(progress, 0.25, 0.85);
      api.focus.reveal('scale-constant-vector-denominator-b2-1', () => {
        text(
          ctx,
          api,
          'Constant token [7, 7, 7, 7] · variance 0',
          1500,
          910,
          24,
          themeColors.cyan,
          'center',
        );
        api.focus.target('constant-vector-denominator', () =>
          equation(
            ctx,
            api,
            String.raw`\sqrt{0+\epsilon}=\sqrt{\epsilon}>0`,
            1500,
            970,
            31,
            themeColors.yellow,
            'center',
          ),
        );
      });
    }
  }
}
export default {
  id: 'scale',
  draw: drawScale,
  cues: [
    'scale-squares',
    'scale-divide',
    'scale-constant-vector-denominator-b2-1',
  ],
};
