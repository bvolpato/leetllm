import { meanX, varianceX } from '../arithmetic.mjs';
import { directed } from '../construction.mjs';
import { data } from '../fixtures.mjs';
import { interceptEstimatorState, predict } from '../model.mjs';
import { box, point, target, text } from '../defaults.mjs';
export function drawStatisticalContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 1) {
      const amount = 2 * directed(state, 'resample-errors', 0.12, 0.52),
        e = [-2 + amount, 1 - 2 * amount, 2 + amount, 1, -2],
        q = api.teaching.axes({
          x: 260,
          y: 420,
          width: 1080,
          height: 430,
          xDomain: [0.5, 5.5],
          yDomain: [-5, 5],
          xTicks: [1, 2, 3, 4, 5],
          yTicks: [-4, 0, 4],
          xLabel: 'same five design rows',
          yLabel: 'fitted residual',
          fontSize: 30,
        });
      api.teaching.curve({
        plot: q,
        points: e.map((y, i) => ({
          x: i + 1,
          y,
        })),
        color: themeColors.pink,
        width: 5,
      });
      target(ctx, api, 'changed-residuals', () =>
        e.forEach((y, i) =>
          point(
            ctx,
            api,
            q,
            {
              x: i + 1,
              y,
            },
            themeColors.pink,
            11,
          ),
        ),
      );
      text(
        ctx,
        api,
        'Change the first three observations',
        960,
        285,
        34,
        themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        `Σe = ${e.reduce((a, v) => a + v, 0).toFixed(2)}`,
        1580,
        460,
        38,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        `Σxe = ${e.reduce((a, v, i) => a + (i + 1) * v, 0).toFixed(2)}`,
        1580,
        650,
        38,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'The fitted residuals share both constraints',
        960,
        1000,
        32,
        themeColors.muted,
        'center',
      );
      return;
    }
    if (currentBeat === 3) {
      const repair = directed(state, 'match-rows', 0.48, 0.77);
      const drop = Math.min(1, 2 * repair),
        move = Math.max(0, 2 * repair - 1);
      text(
        ctx,
        api,
        move === 1
          ? 'Matched rows give five errors'
          : 'Broadcasting creates 25 prediction/target pairs',
        960,
        280,
        35,
        themeColors.yellow,
        'center',
      );
      data.forEach((row, i) => {
        text(ctx, api, 'y ' + row.y, 350, 435 + i * 95, 29, themeColors.cyan, 'center');
        text(ctx, api, 'ŷ ' + predict(row.x), 610 + i * 145, 350, 27, themeColors.blue, 'center');
      });
      data.forEach((row, i) =>
        data.forEach((col, j) => {
          const matched = i === j,
            alpha = matched ? 1 : 1 - drop;
          if (alpha < 0.01) return;
          const xx = matched ? api.lerp(550 + j * 145, 1500, move) : 550 + j * 145,
            yy = 390 + i * 95;
          api.components.fade(alpha, () => {
            box(ctx, api, xx, yy, 120, 75, matched ? themeColors.green : themeColors.pink);
            text(
              ctx,
              api,
              String(predict(col.x) - row.y),
              xx + 60,
              yy + 49,
              30,
              matched ? themeColors.green : themeColors.pink,
              'center',
            );
          });
        }),
      );
      target(ctx, api, 'error-shape', () =>
        text(
          ctx,
          api,
          move === 1 ? '(5,) − (5,) → (5,)' : '(5,) − (5,1) → (5,5)',
          960,
          955,
          40,
          move === 1 ? themeColors.green : themeColors.pink,
          'center',
        ),
      );
      text(
        ctx,
        api,
        move === 1
          ? 'Mean of 5 squared errors = 2.8 ms²'
          : repair === 0
            ? 'Mean of 25 squared differences = 1,602.8 ms²'
            : 'Pair each prediction with its own request',
        960,
        1040,
        30,
        themeColors.muted,
        'center',
      );
      return;
    }
    if (currentBeat === 0) {
      const model = interceptEstimatorState(directed(state, 'weights-spread', 0.18, 0.58)),
        x = (value) => 450 + ((value - 96.5) / 7) * 1050;
      text(
        ctx,
        api,
        'Same design · hypothetical y = 100 + 20x + independent ±1 errors',
        960,
        280,
        30,
        themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        '32 equally likely error patterns · compare one coefficient',
        960,
        350,
        33,
        themeColors.muted,
        'center',
      );
      [
        [model.olsEstimates, 570, themeColors.green, 'OLS'],
        [model.otherEstimates, 820, themeColors.cyan, 'Other linear unbiased'],
      ].forEach(([values, y, color, label]) => {
        const seen = new Map();
        api.line(ctx, x(96.5), y, x(103.5), y, themeColors.muted, 2);
        text(ctx, api, label, 200, y - 60, 28, color);
        values.forEach((value) => {
          const key = value.toFixed(7),
            n = seen.get(key) ?? 0;
          seen.set(key, n + 1);
          api.circle(ctx, x(value), y - 22 - n * 24, 9, color);
        });
        [98, 100, 102].forEach((value) =>
          text(ctx, api, String(value), x(value), y + 45, 27, themeColors.muted, 'center'),
        );
      });
      api.line(ctx, x(100), 390, x(100), 570, themeColors.yellow, 3);
      api.line(ctx, x(100), 650, x(100), 820, themeColors.yellow, 3);
      text(
        ctx,
        api,
        `variance ${model.olsVariance.toFixed(2)}`,
        1590,
        500,
        32,
        themeColors.green,
        'center',
      );
      target(ctx, api, 'estimator-spread', () =>
        text(
          ctx,
          api,
          `variance ${model.otherVariance.toFixed(2)}`,
          1590,
          750,
          32,
          themeColors.cyan,
          'center',
        ),
      );
      text(
        ctx,
        api,
        'True intercept 100 ms · each dot is one fitted intercept',
        960,
        970,
        32,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Variance across the 32 equally likely samples (ms²)',
        960,
        1040,
        28,
        themeColors.muted,
        'center',
      );
    } else {
      const x = 6,
        fit = predict(x),
        df = data.length - 2;
      const variance = data.reduce((sum, r) => sum + (r.y - predict(r.x)) ** 2, 0) / df;
      const leverage = 1 / data.length + (x - meanX) ** 2 / (data.length * varianceX);
      // Two-sided 95% Student interval with three residual degrees of freedom.
      const critical = 3.182446305284263;
      const meanHalf = critical * Math.sqrt(variance * leverage);
      const futureHalf = critical * Math.sqrt(variance * (1 + leverage));
      const widen = directed(state, 'future-interval', 0.4, 0.7);
      const scale = (ms) => 1130 + (ms - fit) * 60;
      text(
        ctx,
        api,
        '600 tokens · classical 95% intervals',
        960,
        275,
        40,
        themeColors.ink,
        'center',
      );
      for (const ms of [210, 215, 220, 225, 230]) {
        const color = ms === fit ? themeColors.muted : '#8794a038';
        api.line(ctx, scale(ms), 401, scale(ms), 540, color, 2);
        api.line(ctx, scale(ms), 619, scale(ms), 733, color, 2);
        text(ctx, api, String(ms), scale(ms), 374, 33, themeColors.muted, 'center');
      }
      const interval = (label, y, half, color) => {
        text(ctx, api, label, 284, y + 14, 35, color, 'center');
        const left = scale(fit - half),
          right = scale(fit + half);
        api.line(ctx, left, y, right, y, color, 8);
        api.line(ctx, left, y - 20, left, y + 20, color, 5);
        api.line(ctx, right, y - 20, right, y + 20, color, 5);
        api.circle(ctx, scale(fit), y, 9, themeColors.ink);
      };
      interval('Mean latency', 514, meanHalf, themeColors.green);
      text(
        ctx,
        api,
        (fit - meanHalf).toFixed(1) + '–' + (fit + meanHalf).toFixed(1) + ' ms',
        1130,
        588,
        35,
        themeColors.green,
        'center',
      );
      target(ctx, api, 'future-width', () => {
        interval(
          widen === 1 ? 'One request' : 'Mean component',
          705,
          critical * Math.sqrt(variance * (leverage + widen)),
          themeColors.pink,
        );
        const label =
          widen === 1
            ? (fit - futureHalf).toFixed(1) + '–' + (fit + futureHalf).toFixed(1) + ' ms'
            : 'Start with mean uncertainty';
        text(ctx, api, label, 1130, 789, 35, themeColors.pink, 'center');
      });
      text(
        ctx,
        api,
        'Assumed straight mean and independent Gaussian errors with common variance',
        960,
        953,
        33,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
}
export default {
  id: 'statistical-contract',
  draw: drawStatisticalContract,
  cues: ['weights-spread', 'resample-errors', 'future-interval', 'match-rows'],
};
