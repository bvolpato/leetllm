import { box, constructionText, footer, heading, line } from '../defaults.mjs';
export function drawAmpPolicy(ctx, scene, state, api) {
  api.focus.target('amp-policy-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    {
      if (currentBeat === 0) {
        heading(ctx, api, 'Follow one forward pass with CUDA autocast');
        [
          ['stored weights', 'FP32', themeColors.blue],
          ['eligible matrix operation', 'FP16 / BF16', themeColors.pink],
          ['cross entropy', 'FP32', themeColors.yellow],
        ].forEach(([name, dtype, col], i) => {
          const y = 410 + i * 165;
          constructionText(ctx, api, name, 230, y + 35, 32, themeColors.muted);
          box(ctx, api, dtype, 1100, y - 10, 600, 105, col, 38);
        });
        footer(ctx, api, 'Leave the autocast region before backward.');
      } else if (currentBeat === 1) {
        heading(ctx, api, 'Float16 range includes subnormals below the normal boundary');
        const x = (power) => 300 + ((power + 9) / 5) * 1300;
        line(ctx, api, 300, 630, 1600, 630);
        for (const exp of [-9, -8, -7, -6, -5, -4]) {
          const u = x(exp);
          line(ctx, api, u, 615, u, 645);
          api.math(ctx, `10^{${exp}}`, u, 730, 34, themeColors.muted, 'center');
        }
        const minimum = Math.log10(2 ** -24),
          normal = Math.log10(2 ** -14);
        line(ctx, api, x(minimum), 480, x(minimum), 780, themeColors.pink, 4);
        line(ctx, api, x(normal), 480, x(normal), 780, themeColors.yellow, 4);
        constructionText(
          ctx,
          api,
          'smallest subnormal ≈5.96e−8',
          640,
          410,
          29,
          themeColors.pink,
          'center',
        );
        constructionText(
          ctx,
          api,
          'smallest normal ≈6.10e−5',
          1400,
          855,
          29,
          themeColors.yellow,
          'center',
        );
        api.circle(ctx, x(-5), 630, 13, themeColors.green);
        box(
          ctx,
          api,
          '1e−5 falls in the subnormal range',
          410,
          900,
          1100,
          80,
          themeColors.green,
          32,
        );
        footer(ctx, api, 'A path that flushes subnormals turns this value into zero.');
      } else {
        heading(ctx, api, 'Follow the CPU branch of this training loop');
        box(ctx, api, 'CPU · AMP disabled', 260, 430, 640, 110, themeColors.blue, 35);
        box(ctx, api, 'use unscaled gradients', 1040, 430, 710, 110, themeColors.cyan, 30);
        box(
          ctx,
          api,
          'optimizer.step() updates the weights',
          410,
          770,
          1100,
          100,
          themeColors.green,
          33,
        );
        footer(ctx, api, 'BF16 keeps the exponent width of FP32 with fewer bits for precision.');
      }
    }
    return true;
  });
}
export default {
  id: 'amp-policy',
  draw: drawAmpPolicy,
  cues: ['amp-policy-beat-0', 'amp-policy-beat-1', 'amp-policy-beat-2'],
};
