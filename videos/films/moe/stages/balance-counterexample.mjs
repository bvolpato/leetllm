import { fmt, vec } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { moeBalance } from '../model.mjs';
import { matrix, mechanismText, rectangle, tag } from '../defaults.mjs';
export function drawBalanceCounterexample(ctx, scene, state, api) {
  const { C: themeColors } = api,
    resultComplete = (id) => moeCue(state, id),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-balance-counterexample-mechanism', () => {
    const rows = [
        [0.51, 0.09, 0.4],
        [0.09, 0.51, 0.4],
      ],
      winners = rows.map((row) => row.indexOf(Math.max(...row))),
      shares = rows[0].map((_, i) => winners.filter((w) => w === i).length / rows.length),
      means = rows[0].map((_, i) => rows.reduce((s, row) => s + row[i], 0) / rows.length),
      f = moeBalance(shares, means);
    rows[0].forEach((_, i) => mechanismText(ctx, api, 'E' + i, 461 + i * 250, 322, 37, cols[i]));
    rows.forEach((_, i) => mechanismText(ctx, api, 'Token ' + i, 215, 402 + i * 80, 33));
    matrix(ctx, api, cols, rows, 340, 355, 250);
    if (resultComplete('counter-routes')) {
      winners.forEach((winner, i) =>
        tag(ctx, api, 't' + i + ' → E' + winner, 1390, 393 + i * 80, 430, cols[winner]),
      );
    }
    if (resultComplete('counter-fractions')) {
      mechanismText(ctx, api, 'Hard fractions ' + vec(f.f), 700, 780, 33, themeColors.cyan);
    }
    if (resultComplete('counter-means'))
      mechanismText(ctx, api, 'Mean probabilities ' + vec(f.p), 700, 850, 33, themeColors.cyan);
    if (resultComplete('counter-score'))
      tag(
        ctx,
        api,
        '3 × (' +
          f.f.map((share, i) => fmt(share) + '×' + fmt(f.p[i])).join(' + ') +
          ') = ' +
          f.score.toFixed(2),
        960,
        935,
        1400,
        themeColors.green,
      );
    if (resultComplete('counter-unused')) {
      rectangle(ctx, api, 1310, 720, 240, 130, themeColors.panel, themeColors.yellow);
      mechanismText(ctx, api, 'E2', 1430, 770, 31, themeColors.yellow);
      mechanismText(ctx, api, '0 assignments', 1430, 825, 27, themeColors.pink);
    }
  });
}
export default {
  id: 'balance-counterexample',
  draw: drawBalanceCounterexample,
  cues: [
    'mo-balance-counterexample-op-0',
    'mo-counter-routes',
    'mo-balance-counterexample-op-1',
    'mo-counter-fractions',
    'mo-counter-means',
    'mo-counter-score',
    'mo-counter-unused',
    'mo-balance-counterexample-op-2',
  ],
};
