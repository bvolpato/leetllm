import { betaDensity } from '../arithmetic.mjs';
import { observed } from '../fixtures.mjs';
import { clamp, done } from '../construction.mjs';
import { productFrame, updateSnapshot } from '../model.mjs';
import { caption, chart, curve, equation, ring, target, text, tile } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawUpdate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const f = (v, n = 3) => v.toFixed(n);
  {
    if (currentBeat === 0) {
      const v = productFrame(state),
        xs = [105, 720, 1335],
        colors = [themeColors.blue, themeColors.yellow, themeColors.green],
        maxima = [1.7, 0.008, 0.008 * v.scale],
        functions = [
          (x) => betaDensity(2, 2, x),
          (x) => x ** 8 * (1 - x) ** 2,
          (x) => betaDensity(2, 2, x) * x ** 8 * (1 - x) ** 2 * v.scale,
        ],
        values = [v.prior, v.likelihood, v.current];
      const titles = [
        'Prior density',
        'Sequence likelihood',
        done(v.normalization)
          ? 'Posterior density'
          : v.normalization > 0
            ? 'Rescaling the product'
            : 'Raw product',
      ];
      xs.forEach((x, i) => {
        text(ctx, api, titles[i], x + 235, 300, 29, colors[i], 'center');
        const q = chart(ctx, api, {
          x,
          y: 390,
          width: 470,
          height: 360,
          max: maxima[i],
          yTicks: [0, Number((maxima[i] / 2).toPrecision(2))],
          label: i === 1 ? 'weight' : 'density',
          ticks: [0, 0.5, 1],
          xLabel: 'candidate rate',
        });
        target(ctx, api, 'product-plot-' + i, () => {
          api.teaching.curve({
            plot: q,
            points: sampleFunction(functions[i], 0, 1, 200),
            color: colors[i],
            width: 4,
          });
          const p = q.point(v.candidate, values[i]);
          api.line(ctx, p.x, q.point(v.candidate, 0).y, p.x, p.y, colors[i], 3);
          ring(ctx, api, p, colors[i], 7);
        });
        text(ctx, api, values[i].toPrecision(4), x + 235, 860, 31, colors[i], 'center');
      });
      text(ctx, api, '×', 650, 560, 54, themeColors.yellow, 'center');
      text(ctx, api, '→', 1260, 560, 54, themeColors.green, 'center');
      target(ctx, api, 'product-normalization', () =>
        equation(
          ctx,
          api,
          `p=${f(v.candidate, 2)},\\quad Z_s=\\frac6{2860},\\quad\\text{current area}\\approx${f(v.area, 4)}`,
          960,
          955,
          36,
          themeColors.green,
        ),
      );
      caption(
        ctx,
        api,
        'The probe follows one candidate rate across all three plots. Each vertical axis has its own scale.',
      );
    } else {
      const v = updateSnapshot(currentBeat, state.beatP ?? 0, state.cues),
        q = chart(ctx, api, {
          y: 465,
          height: 355,
          max: 6,
        });
      const active = Math.min(9, v.processed),
        next = observed[active],
        travel = clamp(
          next.pass ? v.passProgress * 8 - active : v.failureProgress * 2 - (active - 8),
        );
      target(ctx, api, 'posterior-outcomes', () => {
        observed.forEach((row, i) =>
          tile(
            ctx,
            api,
            row,
            180 + i * 156,
            255,
            132,
            68,
            i < v.processed ? 0.35 : i === active && travel > 0 && travel < 1 ? 0 : 1,
          ),
        );
        if (currentBeat === 1 && travel > 0 && travel < 1) {
          const x =
              180 + active * 156 + (1450 - (180 + active * 156)) * clamp((travel - 0.2) / 0.8),
            y = 255 + 75 * clamp(travel / 0.2);
          tile(ctx, api, next, x, y, 132, 68);
        }
      });
      curve(ctx, api, q, 2, 2, themeColors.blue + '88', 3);
      target(ctx, api, 'posterior-density', () => curve(ctx, api, q, v.a, v.b, themeColors.yellow));
      text(
        ctx,
        api,
        v.complete ? 'Completed update' : 'One task result at a time',
        1560,
        currentBeat === 1 ? 480 : 420,
        28,
        themeColors.muted,
        'center',
      );
      target(ctx, api, 'posterior-parameters', () =>
        equation(
          ctx,
          api,
          `\\operatorname{Beta}(${v.a},${v.b})`,
          1560,
          currentBeat === 1 ? 600 : 540,
          54,
          themeColors.yellow,
        ),
      );
      target(ctx, api, 'posterior-progress', () =>
        text(
          ctx,
          api,
          `${v.processed} of 10 outcomes included`,
          1560,
          currentBeat === 1 ? 710 : 650,
          29,
          themeColors.ink,
          'center',
        ),
      );
      if (currentBeat === 2) {
        target(ctx, api, 'posterior-mean', () =>
          equation(
            ctx,
            api,
            'E[p\\mid D]=\\frac{10}{14}\\approx0.714',
            1560,
            760,
            37,
            themeColors.green,
          ),
        );
        equation(ctx, api, '\\frac4{14}(0.5)+\\frac{10}{14}(0.8)', 1560, 885, 36, themeColors.ink);
        const p = q.point(10 / 14, betaDensity(10, 4, 10 / 14));
        api.line(ctx, p.x, q.point(10 / 14, 0).y, p.x, p.y, themeColors.green, 3);
      }
      caption(
        ctx,
        api,
        currentBeat === 1
          ? 'Each numbered outcome enters once · the blue outline retains the starting prior'
          : 'Prior weight 4 is an assumption · the 10 observed tasks supply the data weight',
      );
    }
  }
}
export default {
  id: 'update',
  draw: drawUpdate,
  cues: [
    'same-rate-probe',
    'normalize-product',
    'posterior-pass-arrivals',
    'posterior-failure-arrivals',
    'posterior-mean-b3-1',
  ],
};
