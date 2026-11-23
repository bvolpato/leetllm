import { forecastChapterState, quantileCost, sum } from '../model.mjs';
import {
  drawForecastChapterBar,
  drawForecastChapterEquation,
  drawForecastChapterHead,
  drawForecastChapterLine,
  drawForecastChapterNote,
  drawForecastChapterPlot,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawCostQuantile(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('cost-quantile-operation', () => {
    if (currentBeat === 0) {
      drawForecastChapterHead(ctx, api, 'One period · positive constant unit costs · no coupling');
      drawForecastChapterEquation(ctx, api, String.raw`C_u(y-a)_+ + C_o(a-y)_+`, 960, 410, 49);
      const a = 145,
        y = 190;
      const ax = drawForecastChapterPlot(
        ctx,
        api,
        240,
        580,
        1380,
        150,
        [80, 240],
        [0, 1],
        [100, 160, 240],
        [],
        'demand / capacity',
        '',
      );
      const pa = ax.point(a, 0),
        py = ax.point(y, 0);
      drawForecastChapterLine(ctx, api, pa.x, 590, pa.x, 680, themeColors.cyan, 4);
      drawForecastChapterLine(ctx, api, py.x, 590, py.x, 680, themeColors.pink, 4);
      drawForecastChapterLine(
        ctx,
        api,
        pa.x,
        620,
        api.lerp(pa.x, py.x, progress),
        620,
        themeColors.pink,
        12,
      );
      drawForecastChapterText(ctx, api, 'capacity a', pa.x, 555, 27, themeColors.cyan, 'center');
      drawForecastChapterText(ctx, api, 'demand y', py.x, 555, 27, themeColors.pink, 'center');
      if (f.started('forecast-cost-rule'))
        drawForecastChapterEquation(ctx, api, String.raw`\tau=\frac{C_u}{C_u+C_o}`, 960, 900, 48);
      drawForecastChapterNote(
        ctx,
        api,
        'Positive part max(value,0) · fixed booking and shared capacity change the optimization.',
      );
    } else if (currentBeat === 1) {
      const level = f.completed('forecast-cost-level'),
        choice = f.completed('forecast-cost-cdf'),
        median = f.completed('forecast-cost-median');
      drawForecastChapterHead(
        ctx,
        api,
        level
          ? 'Same distribution · underage 3 / overage 1 → τ = 0.75'
          : 'Same distribution · underage 3 / overage 1',
      );
      const ax = drawForecastChapterPlot(
          ctx,
          api,
          230,
          430,
          1400,
          360,
          [70, 260],
          [0, 1],
          [100, 160, 240],
          [0, 0.55, 0.75, 1],
          'capacity',
          'cumulative probability',
        ),
        levels = [0.55, 0.8, 1],
        xs = [100, 160, 240],
        n = Math.ceil(3 * f.progress('forecast-cost-level'));
      drawForecastChapterText(
        ctx,
        api,
        'p(100)=0.55 · p(160)=0.25 · p(240)=0.20',
        960,
        355,
        29,
        themeColors.muted,
        'center',
      );
      for (let i = 0; i < n; i++) {
        const start = i ? xs[i - 1] : 70,
          a = ax.point(start, i ? levels[i - 1] : 0),
          v = ax.point(xs[i], levels[i]);
        drawForecastChapterLine(ctx, api, a.x, a.y, v.x, a.y, themeColors.blue, 4);
        drawForecastChapterLine(ctx, api, v.x, a.y, v.x, v.y, themeColors.blue, 4);
        drawForecastChapterText(
          ctx,
          api,
          levels[i].toFixed(2),
          v.x + 18,
          v.y - 12,
          27,
          themeColors.blue,
        );
      }
      if (level) {
        const yy = ax.point(70, 0.75).y;
        drawForecastChapterLine(ctx, api, 230, yy, 1630, yy, themeColors.yellow, 3);
        drawForecastChapterText(ctx, api, 'τ=.75', 1650, yy + 8, 29, themeColors.yellow);
      }
      if (choice) {
        const q = ax.point(160, 0.8);
        api.circle(ctx, q.x, q.y, 14, themeColors.green);
        drawForecastChapterText(
          ctx,
          api,
          'First CDF ≥ τ: 160',
          960,
          940,
          34,
          themeColors.green,
          'center',
        );
      }
      drawForecastChapterNote(
        ctx,
        api,
        median
          ? 'Median 100 · critical cost quantile 160 · supplied distribution'
          : 'Supplied distribution · compare the cumulative probability with the cost threshold',
      );
    } else {
      drawForecastChapterHead(
        ctx,
        api,
        'Build each expected loss from the same shortage / spare terms',
      );
      const names = ['forecast-cost100', 'forecast-cost160', 'forecast-cost240'];
      [100, 160, 240].forEach((a, i) => {
        const x = 210 + i * 560;
        drawForecastChapterText(ctx, api, 'Capacity ' + a, x, 385, 32, themeColors.cyan);
        const terms = quantileCost(a),
          earned = f.completed(names[i]);
        terms.forEach((r, j) => {
          drawForecastChapterText(
            ctx,
            api,
            `y${r.demand} · p${r.probability}`,
            x,
            470 + j * 105,
            27,
            themeColors.muted,
          );
          if (earned) {
            drawForecastChapterBar(
              ctx,
              api,
              r.term,
              100,
              x + 190,
              440 + j * 105,
              300,
              themeColors.yellow,
            );
            drawForecastChapterText(
              ctx,
              api,
              r.term.toFixed(1),
              x + 495,
              475 + j * 105,
              27,
              themeColors.yellow,
              'right',
            );
          }
        });
        if (earned) {
          drawForecastChapterText(
            ctx,
            api,
            'Expected cost ' + sum(terms.map((t) => t.term)).toFixed(1),
            x,
            840,
            30,
            themeColors.yellow,
          );
          drawForecastChapterText(ctx, api, 'MAE ' + [43, 49, 97][i], x, 905, 30, themeColors.blue);
        } else
          drawForecastChapterText(
            ctx,
            api,
            'Compute weighted terms',
            x,
            840,
            27,
            themeColors.muted,
          );
      });
      drawForecastChapterNote(
        ctx,
        api,
        'OLS squared error and the selective peak diagnostic are different objectives.',
      );
    }
  });
}
export default {
  id: 'cost-quantile',
  draw: drawCostQuantile,
  cues: [
    'cost-quantile-0',
    'forecast-cost-rule',
    'cost-quantile-1',
    'forecast-cost-cdf',
    'forecast-cost-level',
    'forecast-cost-median',
    'cost-quantile-2',
    'forecast-cost100',
    'forecast-cost160',
    'forecast-cost240',
  ],
};
