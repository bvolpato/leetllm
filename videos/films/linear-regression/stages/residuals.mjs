import { clamp } from '../arithmetic.mjs';
import { data } from '../fixtures.mjs';
import { directed } from '../construction.mjs';
import { predict } from '../model.mjs';
import { curve, observations, plot, target, text } from '../defaults.mjs';
export function drawResiduals(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  {
    const transfer = currentBeat > 0 ? 1 : directed(state, 'residual-transfer', 0.2, 0.65),
      shift =
        currentBeat === 1
          ? 6 *
            directed(state, 'residual-shift', 0.35, 0.5) *
            (1 - directed(state, 'residual-return', 0.72, 0.9))
          : 0;
    const left = plot(ctx, api, 210, 365, 700, 430),
      right = plot(ctx, api, 1190, 365, 500, 430, [0.5, 5.5], [-8, 4]);
    curve(ctx, api, left, (x) => predict(x, 100 + shift, 20));
    observations(ctx, api, left);
    data.forEach((row) => {
      const a = left.point(row.x, predict(row.x, 100 + shift)),
        z = left.point(row.x, row.y);
      api.path(ctx, [a, z], {
        color: row.x === 3 ? themeColors.pink : themeColors.muted,
        width: row.x === 3 ? 7 : 4,
        clip: left.bounds,
      });
    });
    const zeroA = right.point(0.5, 0),
      zeroB = right.point(5.5, 0);
    api.path(ctx, [zeroA, zeroB], {
      color: themeColors.muted,
      width: 2,
      clip: right.bounds,
    });
    target(ctx, api, 'residual-pattern', () =>
      target(ctx, api, 'selected-residual', () => {
        const a = left.point(3, 162),
          z = right.point(3, 2 - shift),
          moving = {
            x: api.lerp(a.x, z.x, transfer),
            y: api.lerp(a.y, z.y, transfer) - 70 * Math.sin(Math.PI * transfer),
          };
        api.circle(ctx, moving.x, moving.y, 22, themeColors.cyan);
        if (state.t >= 0.4)
          text(ctx, api, 'C', moving.x, moving.y + 8, 24, themeColors.bg, 'center');
      }),
    );
    target(ctx, api, 'residual-pattern', () => {
      const prediction = 160 + shift,
        residual = 162 - prediction;
      text(
        ctx,
        api,
        `C: 162 − ${prediction.toFixed(1)} = ${residual >= 0 ? '+' : ''}${residual.toFixed(1)} ms`,
        725,
        965,
        44,
        themeColors.cyan,
        'center',
      );
      const others = currentBeat === 0 ? 0 : directed(state, 'residual-others', 0.02, 0.3);
      data
        .filter((row) => row.x !== 3)
        .forEach((row) => {
          if (others > 0) {
            const at = right.point(row.x, (row.y - predict(row.x) - shift) * others);
            api.circle(ctx, at.x, at.y, 10, themeColors.yellow);
          }
        });
      if (currentBeat === 1 && shift > 0)
        text(
          ctx,
          api,
          `line raised ${shift.toFixed(1)} ms`,
          1460,
          965,
          38,
          themeColors.pink,
          'center',
        );
    });
    text(ctx, api, 'latency scale', 560, 285, 30, themeColors.muted, 'center');
    text(ctx, api, 'same requests · residual scale', 1440, 285, 30, themeColors.pink, 'center');
    if (currentBeat === 1)
      text(
        ctx,
        api,
        `MSE ${(2.8 + shift * shift).toFixed(1)} ms² · minimum 2.8 ms²`,
        960,
        1045,
        31,
        shift > 0 ? themeColors.pink : themeColors.green,
        'center',
      );
  }
}
export default {
  id: 'residuals',
  draw: drawResiduals,
  cues: ['residual-transfer', 'residual-others', 'residual-shift', 'residual-return'],
};
