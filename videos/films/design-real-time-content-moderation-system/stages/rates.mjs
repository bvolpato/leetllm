import { moderationPopulation, sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawRates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel(state);
  {
    const data = moderationPopulation(100000, 0.001, 0.95, 0.01),
      fraction = modelState.b ? 1 : modelState.p;
    text(
      ctx,
      api,
      'Authored population: 100,000 · prevalence 0.1%',
      960,
      280,
      34,
      themeColors.ink,
      'center',
    );
    api.focus.target('rates-violations-violations-100', () => {
      api.rect(
        ctx,
        170,
        365,
        (1550 * data.violations) / data.total,
        75,
        themeColors.yellow,
        undefined,
        0,
      );
      text(ctx, api, '100 violations', 170, 340, 28, themeColors.yellow);
    });
    api.focus.target('rates-legitimate-legitimate-tolocalestring-99-900', () => {
      api.rect(
        ctx,
        170 + (1550 * data.violations) / data.total,
        365,
        (1550 * data.legitimate) / data.total,
        75,
        themeColors.blue,
        undefined,
        0,
      );
      text(ctx, api, '99,900 legitimate', 1720, 340, 28, themeColors.blue, 'right');
    });
    const tp = Math.round(data.tp * fraction),
      fp = Math.round(data.fp * fraction);
    [
      [
        tp + ' true blocks',
        fraction === 1
          ? data.fn + ' missed violations'
          : data.violations - tp + ' violations not yet placed',
        themeColors.green,
        themeColors.yellow,
      ],
      [
        fp + ' wrongful blocks',
        fraction === 1
          ? data.tn.toLocaleString() + ' correctly allowed'
          : (data.legitimate - fp).toLocaleString() + ' legitimate not yet placed',
        themeColors.pink,
        themeColors.blue,
      ],
    ].forEach(([a, z, color, other], i) => {
      const x = 170 + i * 850;
      card(ctx, api, a, x, 520, 700, color, 80);
      text(ctx, api, z, x + 350, 670, 29, other, 'center');
    });
    api.focus.target('rates-tp-fp-true-blocks-wrongful-blocks', () => {
      text(
        ctx,
        api,
        'Construct the blocked pool · horizontal magnification ×' +
          (data.total / (data.tp + data.fp)).toFixed(2),
        960,
        760,
        29,
        themeColors.muted,
        'center',
      );
      api.rect(ctx, 170, 810, 1550, 75, themeColors.panel, themeColors.muted, 0);
      api.rect(
        ctx,
        170,
        810,
        (1550 * tp) / (data.tp + data.fp),
        75,
        themeColors.green,
        undefined,
        0,
      );
      api.rect(
        ctx,
        170 + (1550 * tp) / (data.tp + data.fp),
        810,
        (1550 * fp) / (data.tp + data.fp),
        75,
        themeColors.pink,
        undefined,
        0,
      );
      text(
        ctx,
        api,
        tp + ' true + ' + fp + ' wrongful = ' + (tp + fp) + ' blocks',
        960,
        940,
        31,
        themeColors.ink,
        'center',
      );
    });
    api.focus.target('rates-precision-result', () => {
      if (api.focus.visible('rates-precision'))
        api.math(
          ctx,
          String.raw`\mathrm{precision}=\frac{95}{95+999}\approx8.7\%`,
          960,
          1020,
          38,
          themeColors.yellow,
          'center',
        );
      else
        text(
          ctx,
          api,
          'Recall divides by violations; false-positive rate divides by legitimate items.',
          960,
          1020,
          27,
          themeColors.muted,
          'center',
        );
    });
  }
}
export default {
  id: 'rates',
  draw: drawRates,
  cues: [
    'rates-beat-1-focus-1',
    'rates-beat-1-focus-2',
    'rates-beat-2-focus-1',
    'rates-beat-2-focus-2',
    'rates-precision',
  ],
};
