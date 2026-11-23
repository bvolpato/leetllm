import { fmt, mc, vec } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { moeBalance } from '../model.mjs';
import { mechanismLine, mechanismText, rectangle } from '../defaults.mjs';
export function drawBalanceValue(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-balance-value-mechanism', () => {
    const f = moeBalance();
    mechanismText(
      ctx,
      api,
      'Hard fractions f × mean probabilities P',
      960,
      285,
      35,
      themeColors.yellow,
    );
    for (let i = 0; i < 4; i++) {
      const x = 270 + i * 430,
        w = f.f[i] * 430,
        h = f.p[i] * 500;
      mechanismText(ctx, api, 'E' + i, x + 80, 365, 31, cols[i]);
      mechanismLine(ctx, api, x, 720, x + 280, 720, themeColors.muted, 2);
      mechanismLine(ctx, api, x, 720, x, 410, themeColors.muted, 2);
      rectangle(ctx, api, x, 720 - h, w, h, cols[i]);
      mechanismText(ctx, api, 'f ' + f.f[i], x + 100, 780, 28, cols[i]);
      mechanismText(ctx, api, 'P ' + f.p[i], x + 100, 835, 28, cols[i]);
      if (resultComplete('balance-products'))
        mechanismText(ctx, api, fmt(f.products[i], 4), x + 100, 900, 31, cols[i]);
    }
    if (resultComplete('balance-sum'))
      mechanismText(ctx, api, 'Σ fP = ' + fmt(f.sum, 4), 550, 970, 34, themeColors.cyan);
    if (resultComplete('balance-score'))
      mechanismText(ctx, api, '4 × 0.4005 = 1.602', 1320, 970, 34, themeColors.green);
    if (currentBeat === 2 && resultComplete('balance-coefficient')) {
      mechanismText(ctx, api, 'STOP gradient through f', 530, 330, 27, themeColors.pink);
      mechanismText(
        ctx,
        api,
        '∂L/∂P before softmax = α × ' + vec(f.coefficients),
        1260,
        330,
        27,
        themeColors.cyan,
      );
    }
  });
}
export default {
  id: 'balance-value',
  draw: drawBalanceValue,
  cues: [
    'mo-balance-value-op-0',
    'mo-balance-products',
    'mo-balance-value-op-1',
    'mo-balance-sum',
    'mo-balance-score',
    'mo-balance-value-op-2',
    'mo-balance-coefficient',
  ],
};
