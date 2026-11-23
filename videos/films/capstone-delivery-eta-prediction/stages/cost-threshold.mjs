import { completed } from '../shipment.mjs';
import { L, costBars, equation, foot, head, numberLine, text } from '../defaults.mjs';
export function drawCostThreshold(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors } = api;
  const done = (id) => completed(api, id);
  api.focus.target('cost-threshold-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'Standard shipment · calibrated late probability p=0.20');
      costBars(ctx, api, {
        x: 240,
        y: 450,
        width: 900,
        height: 340,
        values: [done('expected-cost') ? 6.4 : null, done('silent-expected-cost') ? 12 : null],
        labels: ['warn expected cost', 'silent expected cost'],
        max: 12,
        colors: [themeColors.green, themeColors.pink],
      });
      text(
        ctx,
        api,
        'False warning 8  /  Missed delay 60',
        1460,
        500,
        29,
        themeColors.blue,
        'center',
      );
      if (done('expected-cost-choice'))
        text(
          ctx,
          api,
          '6.4 <12 → warn has lower expected penalty',
          1460,
          735,
          28,
          themeColors.green,
          'center',
        );
      else text(ctx, api, 'Action comparison pending', 1460, 735, 28, themeColors.muted, 'center');
      foot(ctx, api, 'Expected penalty per decision   /   Correct decisions cost zero');
    } else if (currentBeat === 1) {
      head(ctx, api, 'Warn when its expected penalty is at most the cost of silence');
      equation(ctx, api, String.raw`(1-p)C_{FP}\le pC_{FN}`, 960, 425, 58);
      equation(ctx, api, String.raw`p\ge\frac{C_{FP}}{C_{FP}+C_{FN}}`, 960, 650, 56);
      text(
        ctx,
        api,
        done('standard-threshold-result')
          ? 'standard: 8/68 ≈0.117647'
          : 'Standard threshold pending',
        500,
        875,
        32,
        themeColors.blue,
        'center',
      );
      text(
        ctx,
        api,
        done('expedited-threshold-result')
          ? 'expedited: 8/158 ≈0.050633'
          : 'Expedited threshold pending',
        1430,
        875,
        32,
        themeColors.pink,
        'center',
      );
      foot(ctx, api, 'A more costly miss lowers the warning threshold');
    } else {
      head(ctx, api, 'Expedited tier   /   Exact cutoff 8 ÷ 158');
      const x = numberLine(ctx, api, 0.049, 0.052, 600),
        a = 0.05,
        z = 0.051,
        cut = 8 / 158;
      L(ctx, api, x(cut), 430, x(cut), 800, themeColors.yellow, 4);
      text(ctx, api, '8/158', x(cut), 380, 32, themeColors.yellow, 'center');
      [a, z].forEach((v, i) => {
        api.circle(ctx, x(v), 600, 12, i ? themeColors.cyan : themeColors.blue);
        text(ctx, api, String(v), x(v), 735, 34, i ? themeColors.cyan : themeColors.blue, 'center');
      });
      if (done('threshold-nearby')) {
        text(ctx, api, '5.0%  →  track', 500, 900, 32, themeColors.blue, 'center');
        text(ctx, api, '5.1%  →  warn', 1430, 900, 32, themeColors.green, 'center');
      }
      foot(
        ctx,
        api,
        'Calibration, capacity, true-warning burden and workload assumptions affect the real objective',
      );
    }
  });
}
export default {
  id: 'cost-threshold',
  draw: drawCostThreshold,
  cues: [
    'expected-cost',
    'silent-expected-cost',
    'expected-cost-choice',
    'standard-threshold-result',
    'expedited-threshold-result',
    'threshold-nearby',
  ],
};
