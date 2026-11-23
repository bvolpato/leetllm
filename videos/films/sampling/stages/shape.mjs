import { begun, directed } from '../construction.mjs';
import {
  drawOriginalSamplingAxes,
  drawOriginalSamplingDensity,
  drawOriginalSamplingDot,
  drawOriginalSamplingEquation,
  drawOriginalSamplingFooter,
  drawOriginalSamplingPath,
  drawOriginalSamplingTarget,
  drawOriginalSamplingText,
} from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawShape(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const guide = (q, x, top, color) =>
    drawOriginalSamplingPath(ctx, api, [q.point(x, 0), q.point(x, top)], color, 3);
  {
    if (beat === 2) {
      const q = drawOriginalSamplingAxes(ctx, api, 225, 350, 1100, 460),
        mean = 6 * Math.exp(0.55 ** 2 / 2);
      drawOriginalSamplingTarget(ctx, api, 'duration-density', () => {
        drawOriginalSamplingDensity(ctx, api, q);
        guide(q, 6, 0.15, themeColors.cyan);
        if (begun(state, 'shape-mean', 0.2)) guide(q, mean, 0.12, themeColors.pink);
        drawOriginalSamplingText(
          ctx,
          api,
          'median: 6.00 s',
          1550,
          395,
          38,
          themeColors.cyan,
          'center',
        );
        drawOriginalSamplingText(
          ctx,
          api,
          begun(state, 'shape-mean', 0.2) ? `mean: ${mean.toFixed(2)} s` : 'mean: ?',
          1550,
          490,
          38,
          themeColors.pink,
          'center',
        );
        drawOriginalSamplingEquation(
          ctx,
          api,
          'T=6e^{0.55Z}',
          1550,
          655,
          44,
          themeColors.ink,
          'center',
        );
      });
      drawOriginalSamplingFooter(
        ctx,
        api,
        'Supplied model · log-space center ln(6) · log-space spread 0.55',
      );
      return;
    }
    const z =
      beat === 0
        ? 0
        : beat === 1
          ? -1 +
            directed(state, 'duration-center', 0.35, 0.55) +
            directed(state, 'duration-high', 0.6, 0.8)
          : 1;
    const reveal = beat > 1 ? 1 : beat === 1 ? directed(state, 'duration-low', 0.1, 0.3) : 0;
    const seconds = 6 * Math.exp(0.55 * z);
    drawOriginalSamplingTarget(ctx, api, 'normal-axis', () => {
      const q = api.teaching.axes({
        x: 250,
        y: 320,
        width: 1400,
        height: 170,
        xDomain: [-3, 3],
        yDomain: [0, 0.45],
        xTicks: [-2, -1, 0, 1, 2],
        yTicks: [],
        xLabel: 'standard normal coordinate z',
        yLabel: '',
      });
      if (beat > 0 || begun(state, 'normal-noise', 0.6))
        api.teaching.curve({
          plot: q,
          points: sampleFunction(
            (x) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI),
            -3,
            3,
            100,
          ),
          color: themeColors.blue,
          width: 4,
        });
      const at = q.point(z, 0);
      drawOriginalSamplingDot(
        ctx,
        api,
        {
          x: at.x,
          y: at.y - 25,
        },
        themeColors.yellow,
        13,
        true,
      );
      drawOriginalSamplingPath(
        ctx,
        api,
        [
          {
            x: at.x,
            y: at.y - 10,
          },
          at,
        ],
        themeColors.yellow,
        2,
      );
    });
    drawOriginalSamplingTarget(ctx, api, 'transform-pair', () => {
      drawOriginalSamplingEquation(
        ctx,
        api,
        'T=6\\exp(0.55Z)',
        960,
        625,
        56,
        themeColors.ink,
        'center',
      );
      drawOriginalSamplingText(
        ctx,
        api,
        `z = ${z.toFixed(2)}`,
        400,
        625,
        37,
        themeColors.blue,
        'center',
      );
      const q = api.teaching.axes({
        x: 250,
        y: 790,
        width: 1400,
        height: 1,
        xDomain: [0, 24],
        yDomain: [0, 1],
        xTicks: [0, 6, 10, 15, 24],
        yTicks: [],
        xLabel: 'positive duration (seconds)',
        yLabel: '',
      });
      if (reveal > 0) {
        const zero = q.point(seconds, 0),
          end = {
            x: zero.x,
            y: zero.y - 30,
          };
        const start = {
          x: 250 + ((z + 3) / 6) * 1400,
          y: 465,
        };
        const moving = api.pointAlongPath(
          [
            start,
            {
              x: 620,
              y: 465,
            },
            {
              x: 620,
              y: 700,
            },
            end,
          ],
          reveal,
        );
        drawOriginalSamplingDot(ctx, api, moving, themeColors.yellow, 14, true);
        if (reveal === 1)
          drawOriginalSamplingPath(
            ctx,
            api,
            [
              {
                x: end.x,
                y: end.y + 16,
              },
              zero,
            ],
            themeColors.yellow,
            2,
          );
      }
      drawOriginalSamplingText(
        ctx,
        api,
        reveal === 1 ? `${seconds.toFixed(2)} s` : 'duration = ?',
        1550,
        625,
        40,
        reveal === 1 ? themeColors.yellow : themeColors.muted,
        'center',
      );
    });
    drawOriginalSamplingTarget(ctx, api, 'duration-density', () => {
      if (beat === 2) {
        drawOriginalSamplingEquation(
          ctx,
          api,
          '\\operatorname{median}(T)=6',
          600,
          920,
          36,
          themeColors.cyan,
          'center',
        );
        drawOriginalSamplingText(
          ctx,
          api,
          'mean ≈ 6.98 s',
          1350,
          920,
          36,
          themeColors.pink,
          'center',
        );
      } else
        drawOriginalSamplingText(
          ctx,
          api,
          'Supplied model: lognormal · positive seconds',
          960,
          920,
          32,
          themeColors.muted,
          'center',
        );
    });
  }
}
export default {
  id: 'shape',
  draw: drawShape,
  cues: [
    'normal-noise',
    'duration-low',
    'duration-center',
    'duration-high',
    'shape-mean',
    'shape-density',
  ],
};
