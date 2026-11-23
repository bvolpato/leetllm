import { gradientClamp, gradientPhase, hiddenUnit } from '../arithmetic.mjs';
import { gradientCue } from '../construction.mjs';
import {
  drawExtensionArrow,
  drawExtensionCaption,
  drawExtensionDot,
  drawExtensionEquation,
  drawExtensionLine,
  drawExtensionPanel,
  drawExtensionText,
  drawHiddenUnitGraph,
  formatGradientValue,
  withTarget,
} from '../defaults.mjs';
export function drawDeepProducts(ctx, scene, state, api) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = gradientClamp(state.beatP ?? 0),
    cues = state.cues;
  const progress = (id, beat, a = 0.1, z = 0.8) =>
    currentBeat < beat
      ? 0
      : currentBeat > beat
        ? 1
        : gradientCue(cues, id, gradientPhase(progress2, a, z));
  const paint = () => {
    if (currentBeat === 0 || (currentBeat === 1 && progress('deep-chain', 1, 0.28, 0.38) === 0)) {
      const s = hiddenUnit([1.5, -4, 2, 0.5]);
      drawHiddenUnitGraph(ctx, api, s, {
        forward: true,
        result: true,
        reverse: Math.ceil(4 * progress('inactive-backward', 0, 0.60, 0.81)),
      });
      drawExtensionCaption(
        ctx,
        api,
        'ReLU input h = −1     ·     ReLU output z = 0',
      );
    } else if (currentBeat === 1) {
      for (const [row, rate, col] of [
        [0, 0.5, themeColors.cyan],
        [1, 2, themeColors.pink],
      ]) {
        const n = Math.floor(10 * (row === 0 ? progress('deep-products-ten', 1, 0.42, 0.55)
          : progress('deep-double-ten', 1, 0.66, 0.83)));
        const yy = 430 + row * 300;
        drawExtensionText(ctx, api, 'local ×' + rate, 190, yy, 30, col);
        for (let i = 0; i < 10; i++) {
          const x = 480 + i * 115;
          drawExtensionDot(ctx, api, x, yy, i < n ? col : themeColors.border, 12);
          if (i < 9)
            drawExtensionLine(
              ctx,
              api,
              x + 14,
              yy,
              x + 100,
              yy,
              i < n - 1 ? col : themeColors.border,
              3,
            );
        }
        drawExtensionEquation(
          ctx,
          api,
          String.raw`1\times${rate}^{${n}}=${formatGradientValue(ctx, api, rate ** n, 8)}`,
          960,
          yy + 100,
          40,
          col,
        );
      }
      drawExtensionCaption(
        ctx,
        api,
        'Ten scalar local multipliers illustrate attenuation and amplification.',
      );
    } else {
      drawExtensionPanel(
        ctx,
        api,
        250,
        430,
        220,
        120,
        () => drawExtensionText(ctx, api, 'x', 360, 507, 47, themeColors.blue, 'center'),
        themeColors.blue,
      );
      drawExtensionPanel(
        ctx,
        api,
        800,
        430,
        320,
        120,
        () => drawExtensionText(ctx, api, 'F(x)', 960, 507, 47, themeColors.cyan, 'center'),
        themeColors.cyan,
      );
      drawExtensionPanel(
        ctx,
        api,
        1450,
        430,
        250,
        120,
        () => drawExtensionText(ctx, api, 'x + F(x)', 1575, 507, 35, themeColors.green, 'center'),
        themeColors.green,
      );
      drawExtensionArrow(ctx, api, 470, 490, 800, 490, themeColors.cyan);
      drawExtensionArrow(ctx, api, 1120, 490, 1450, 490, themeColors.cyan);
      drawExtensionLine(ctx, api, 360, 430, 360, 340, themeColors.yellow, 4);
      drawExtensionLine(ctx, api, 360, 340, 1575, 340, themeColors.yellow, 4);
      drawExtensionArrow(ctx, api, 1575, 340, 1575, 430, themeColors.yellow);
      drawExtensionEquation(
        ctx,
        api,
        String.raw`\frac{d}{dx}\bigl[x+F(x)\bigr]=1+F'(x)`,
        960,
        790,
        52,
        themeColors.yellow,
      );
      drawExtensionCaption(
        ctx,
        api,
        'The two routes add their derivatives at the input.',
      );
    }
  };
  withTarget(ctx, api, 'deep-products-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'deep-products',
  draw: drawDeepProducts,
  cues: ['deep-products-b1', 'inactive-backward', 'deep-products-b2', 'deep-chain', 'deep-products-ten', 'deep-double-ten', 'deep-products-b3'],
};
