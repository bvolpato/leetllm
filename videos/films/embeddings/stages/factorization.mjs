import { clamp, completed, event } from '../construction.mjs';
import { countRepresentation } from '../model.mjs';
import { axes, centeredText, extensionText, vectorArrow, numberMatrix } from '../defaults.mjs';
export function drawFactorization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat),
    done = (name, beat) => completed(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString());
  api.focus.target('factorization-mechanism', () => {
    const m = countRepresentation(),
      scale = ev('factor-scale', 0),
      rows = ev('factor-rows', 1),
      sign = ev('factor-sign', 2),
      flip = Math.cos(Math.PI * sign),
      vectors = m.vectors.map((v) => [v[0] * flip, v[1]]);
    numberMatrix(ctx, api, themeColors, fmt, m.ppmi, 150, 410, {
      cell: 110,
      label: 'same PPMI rows',
      format: fmt,
    });
    extensionText(ctx, api, '→', 700, 600, 54, themeColors.muted);
    numberMatrix(
      ctx,
      api,
      themeColors,
      fmt,
      m.singular.map((v) => [v]),
      850,
      475,
      {
        cell: 105,
        color: themeColors.yellow,
        label: 'singular strengths',
        visible: () => ev('factor-two', 0) > 0,
      },
    );
    const a = axes(ctx, api, 1140, 395, 560, 480, [-1.2, 1.2], [-1.2, 1.2], [-1, 0, 1]);
    vectors.forEach((v, i) => {
      if (rows > i / 4) {
        const growth = clamp(rows * 4 - i),
          col = i < 2 ? themeColors.green : themeColors.cyan;
        vectorArrow(
          ctx,
          api,
          a,
          v.map((x) => x * growth * Math.max(0.1, scale)),
          col,
        );
      }
    });
    centeredText(ctx, api, 'apple + pear', 1245, 335, 29, themeColors.green);
    centeredText(ctx, api, 'river + lake', 1600, 335, 29, themeColors.cyan);
    centeredText(
      ctx,
      api,
      done('factor-cross', 1)
        ? 'cos(apple, pear) = 1 · cos(apple, river) = 0'
        : 'Two fitted coordinates per word',
      960,
      985,
      31,
      themeColors.ink,
    );
    if (currentBeat === 2)
      centeredText(
        ctx,
        api,
        sign === 1
          ? 'Axis 1 sign reversed for every word'
          : 'Flip the same whole axis consistently',
        960,
        300,
        32,
        themeColors.yellow,
      );
  });
}
export default {
  id: 'factorization',
  draw: drawFactorization,
  cues: [
    'emb-factor-two',
    'emb-factor-scale',
    'emb-factor-rows',
    'emb-factor-cross',
    'emb-factor-sign',
  ],
};
