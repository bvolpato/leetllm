import { harmonicFixture } from '../model.mjs';
import { cueAmount, equation, rectangle, text } from '../defaults.mjs';
export function drawHarmonicMean(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-harmonic-mean-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-harmonic-mean-mechanism', () => {
    const r = harmonicFixture();
    text(
      ctx,
      api,
      'One selected positive; ninety-nine missed positives',
      960,
      270,
      35,
      themeColors.muted,
    );
    for (let i = 0; i < 100; i++) {
      const x = 240 + (i % 20) * 72,
        y = 370 + Math.floor(i / 20) * 65;
      rectangle(ctx, api, x, y, 45, 45, i === 0 ? themeColors.green : themeColors.pink);
      if (i === 0) rectangle(ctx, api, x - 7, y - 7, 59, 59, '#00000000', themeColors.yellow);
    }
    if (currentBeat === 0) {
      text(ctx, api, 'P = 1', 550, 780, 43, themeColors.green);
      text(ctx, api, 'R = 1/100', 1370, 780, 43, themeColors.pink);
      if (resultComplete('lr-harmonic-formula'))
        equation(ctx, api, 'F_1=\\frac{2PR}{P+R}=\\frac2{1/P+1/R}', 960, 930, 49, themeColors.cyan);
    } else if (currentBeat === 1) {
      const p = cueAmount(ctx, api, 'lr-harmonic-answer');
      rectangle(ctx, api, 370, 790, 960 * r.arithmetic, 50, themeColors.blue);
      rectangle(ctx, api, 370, 890, 960 * r.f1 * p, 50, themeColors.cyan);
      text(ctx, api, 'Arithmetic ' + r.arithmetic.toFixed(3), 1500, 825, 32, themeColors.blue);
      text(
        ctx,
        api,
        resultComplete('lr-harmonic-answer') ? 'F1 ' + r.f1.toFixed(4) : 'Harmonic result pending',
        1500,
        925,
        32,
        themeColors.cyan,
      );
    } else {
      equation(ctx, api, 'F_1=\\frac{2TP}{2TP+FP+FN}', 960, 800, 52, themeColors.cyan);
      if (resultComplete('lr-harmonic-counts'))
        equation(
          ctx,
          api,
          '\\frac{2}{2+0+99}=' + r.f1.toFixed(4),
          960,
          940,
          49,
          themeColors.yellow,
        );
    }
  });
}
export default {
  id: 'harmonic-mean',
  draw: drawHarmonicMean,
  cues: [
    'lr-harmonic-mean-step-0',
    'lr-harmonic-formula',
    'lr-harmonic-mean-step-1',
    'lr-harmonic-answer',
    'lr-harmonic-mean-step-2',
    'lr-harmonic-counts',
  ],
};
