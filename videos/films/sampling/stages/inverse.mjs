import { durationCdf, inverseFrame } from '../model.mjs';
import {
  drawOriginalSamplingAxes,
  drawOriginalSamplingDot,
  drawOriginalSamplingEquation,
  drawOriginalSamplingFooter,
  drawOriginalSamplingPath,
  drawOriginalSamplingTarget,
  drawOriginalSamplingText,
} from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawInverse(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = inverseFrame(state),
      q = drawOriginalSamplingAxes(
        ctx,
        api,
        225,
        350,
        1000,
        460,
        [0, 24],
        [0, 1],
        'cumulative probability',
      );
    api.teaching.curve({
      plot: q,
      points: sampleFunction(durationCdf, 0, 24, 160),
      color: themeColors.cyan,
      width: 5,
    });
    drawOriginalSamplingTarget(ctx, api, 'inverse-guide', () => {
      const a = q.point(0, f.rank),
        z = q.point(f.seconds, f.rank),
        end = q.point(f.seconds, 0);
      if (f.rankVisible) {
        drawOriginalSamplingDot(ctx, api, a, themeColors.yellow, 12, true);
        drawOriginalSamplingText(
          ctx,
          api,
          `u = ${f.rank.toFixed(2)}`,
          260,
          300,
          34,
          themeColors.yellow,
        );
      }
      if (f.progress > 0) {
        const h = Math.min(1, f.progress * 2),
          v = Math.max(0, f.progress * 2 - 1);
        drawOriginalSamplingPath(
          ctx,
          api,
          [
            a,
            {
              x: api.lerp(a.x, z.x, h),
              y: a.y,
            },
          ],
          themeColors.yellow,
          5,
        );
        if (v > 0)
          drawOriginalSamplingPath(
            ctx,
            api,
            [
              z,
              {
                x: end.x,
                y: api.lerp(z.y, end.y, v),
              },
            ],
            themeColors.yellow,
            5,
          );
        const moving =
          f.progress <= 0.5
            ? {
                x: api.lerp(a.x, z.x, h),
                y: a.y,
              }
            : {
                x: end.x,
                y: api.lerp(z.y, end.y, v),
              };
        drawOriginalSamplingDot(ctx, api, moving, themeColors.yellow, 13, true);
      }
      drawOriginalSamplingText(
        ctx,
        api,
        f.resultKnown ? `${f.seconds.toFixed(2)} seconds` : 'duration = ?',
        1550,
        430,
        45,
        f.resultKnown ? themeColors.yellow : themeColors.muted,
        'center',
      );
      if (f.resultKnown)
        drawOriginalSamplingText(
          ctx,
          api,
          f.rank === 0.95 ? '95% finish by this time' : '25% finish by this time',
          1550,
          505,
          30,
          themeColors.muted,
          'center',
        );
    });
    drawOriginalSamplingTarget(ctx, api, 'inverse-formula', () => {
      drawOriginalSamplingEquation(
        ctx,
        api,
        'T=F^{-1}(U)',
        1550,
        635,
        44,
        themeColors.ink,
        'center',
      );
      if (f.recipe) {
        drawOriginalSamplingEquation(
          ctx,
          api,
          'T=6e^{0.55\\Phi^{-1}(U)}',
          1550,
          740,
          39,
          themeColors.blue,
          'center',
        );
        drawOriginalSamplingText(
          ctx,
          api,
          'Φ⁻¹: standard normal quantile',
          1550,
          820,
          26,
          themeColors.muted,
          'center',
        );
      }
    });
    drawOriginalSamplingFooter(ctx, api, 'Uniform ranks → the chosen duration distribution');
  }
}
export default {
  id: 'inverse',
  draw: drawInverse,
  cues: ['rank-quarter', 'inverse-quarter', 'inverse-recipe', 'rank-tail', 'inverse-tail'],
};
