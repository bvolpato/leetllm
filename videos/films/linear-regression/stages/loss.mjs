import { clamp } from '../arithmetic.mjs';
import { data } from '../fixtures.mjs';
import { directed } from '../construction.mjs';
import { predict } from '../model.mjs';
import { box, curve, equation, observations, plot, point, target, text } from '../defaults.mjs';
export function drawLoss(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  {
    const collect = currentBeat === 0 ? directed(state, 'loss-collect', 0.15, 0.75) : 1,
      count = Math.min(5, Math.floor(collect * 5) + 1);
    const residuals = data.map((row) => row.y - predict(row.x)),
      squares = residuals.map((e) => e * e),
      sum = squares.slice(0, count).reduce((a, v) => a + v, 0);
    if (currentBeat < 2) {
      text(ctx, api, 'Each request keeps its identity', 960, 290, 31, themeColors.muted, 'center');
      residuals.forEach((e, i) => {
        const x = 300 + i * 325,
          color = i === 2 ? themeColors.cyan : themeColors.pink;
        text(
          ctx,
          api,
          String.fromCharCode(65 + i),
          x,
          370,
          29,
          i === 2 ? themeColors.cyan : themeColors.muted,
          'center',
        );
        text(ctx, api, `${e > 0 ? '+' : ''}${e} ms`, x, 435, 35, themeColors.ink, 'center');
        target(ctx, api, 'squared-ledger', () => {
          if (i < count) {
            const side = 90 * Math.abs(e);
            box(ctx, api, x - side / 2, 505, side, side, color);
            equation(ctx, api, String(e * e), x, 505 + side / 2 + 14, 44, color, 'center');
          }
        });
      });
      const averaged = currentBeat > 0 ? directed(state, 'loss-average', 0.05, 0.3) : 0,
        root = currentBeat > 0 ? directed(state, 'loss-root', 0.45, 0.75) : 0;
      target(ctx, api, 'loss-mean', () =>
        equation(
          ctx,
          api,
          averaged > 0
            ? '\\mathrm{MSE}=\\frac{14}{5}=2.8\\;ms^2'
            : `\\text{collected squares}=${sum}\\;ms^2`,
          960,
          795,
          48,
          themeColors.pink,
          'center',
        ),
      );
      target(ctx, api, 'loss-root-shape', () => {
        if (currentBeat === 1) {
          const side = Math.sqrt(2.8) * 90;
          box(ctx, api, 500, 850, side, side, themeColors.pink);
          api.line(ctx, 500, 1015, 500 + side * root, 1015, themeColors.yellow, 6);
          text(
            ctx,
            api,
            root === 1 ? 'RMSE ≈ 1.67 ms' : 'area → side length',
            1130,
            955,
            40,
            root === 1 ? themeColors.yellow : themeColors.muted,
            'center',
          );
        }
      });
    } else if (currentBeat === 0) {
      data.forEach((row, i) => {
        const xx = 300 + i * 325,
          e = -row.y;
        text(ctx, api, String.fromCharCode(65 + i), xx, 875, 28, themeColors.muted, 'center');
        text(ctx, api, `e = ${e}`, xx, 930, 29, themeColors.cyan, 'center');
        text(
          ctx,
          api,
          `[${((2 * e) / 5).toFixed(1)}, ${((2 * e * row.x) / 5).toFixed(1)}]`,
          xx,
          990,
          27,
          themeColors.yellow,
          'center',
        );
      });
      text(
        ctx,
        api,
        'Each row contributes to the same [intercept, slope] gradient',
        960,
        1045,
        28,
        themeColors.muted,
        'center',
      );
    } else {
      const q = plot(ctx, api, 220, 350, 840, 410);
      curve(ctx, api, q, (x) => predict(x));
      observations(ctx, api, q, 5, true);
      const baseline = directed(state, 'loss-baseline', 0.12, 0.4);
      if (baseline > 0) curve(ctx, api, q, () => 160, themeColors.blue, 0, 6, 5, baseline);
      text(ctx, api, 'fitted line', 1270, 350, 30, themeColors.cyan);
      text(ctx, api, 'mean-only rule', 1270, 480, 30, themeColors.blue);
      target(ctx, api, 'loss-comparison', () => {
        text(ctx, api, 'MSE 2.8 ms²', 1500, 410, 37, themeColors.ink, 'center');
        text(ctx, api, 'MSE 802.8 ms²', 1500, 540, 37, themeColors.ink, 'center');
        if (directed(state, 'loss-score', 0.5, 0.7) > 0)
          equation(
            ctx,
            api,
            'R^2=1-\\frac{2.8}{802.8}\\approx0.9965',
            1400,
            675,
            38,
            themeColors.yellow,
            'center',
          );
      });
      const rplot = plot(ctx, api, 1280, 800, 400, 145, [0.5, 5.5], [-4, 4]);
      api.path(ctx, [rplot.point(0.5, 0), rplot.point(5.5, 0)], {
        color: themeColors.muted,
        width: 2,
        clip: rplot.bounds,
      });
      data.forEach((row) =>
        point(
          ctx,
          api,
          rplot,
          {
            x: row.x,
            y: row.y - predict(row.x),
          },
          row.x === 3 ? themeColors.cyan : themeColors.pink,
          7,
        ),
      );
    }
  }
}
export default {
  id: 'loss',
  draw: drawLoss,
  cues: ['loss-collect', 'loss-average', 'loss-root', 'loss-baseline', 'loss-score'],
};
