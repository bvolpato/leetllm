import { mean } from '../arithmetic.mjs';
import {
  drawConstructionDot,
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionText,
} from '../defaults.mjs';
export function drawMissingContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.1, z = 0.78) => api.phase(progress, a, z);
  {
    if (currentBeat === 2) {
      const fitted = [0.2, 0.5, 0.8],
        average = mean(fitted),
        truth = 0.4,
        variance = mean(fitted.map((v) => (v - average) ** 2)),
        bias = (average - truth) ** 2,
        noise = 0.1;
      drawConstructionText(
        ctx,
        api,
        'Toy squared-error model · independent zero-mean outcome noise',
        960,
        315,
        32,
        themeColors.muted,
      );
      const q = teaching.axes({
        x: 280,
        y: 480,
        width: 1300,
        height: 200,
        xDomain: [0, 1],
        yDomain: [0, 1],
        xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
        yTicks: [],
        xLabel: 'prediction at one fixed input',
        yLabel: '',
        fontSize: 26,
      });
      fitted.forEach((v, i) => {
        const at = q.point(v, 0.5);
        drawConstructionDot(ctx, api, at.x, at.y, i % 2, 18);
        drawConstructionText(ctx, api, 'fit ' + (i + 1), at.x, at.y - 65, 30, themeColors.blue);
      });
      const at = q.point(truth, 0.5),
        mu = q.point(average, 0.5);
      api.line(ctx, at.x, at.y + 40, mu.x, mu.y + 40, themeColors.yellow, 6);
      drawConstructionText(
        ctx,
        api,
        'truth 0.40 · mean fit 0.50',
        960,
        790,
        33,
        themeColors.yellow,
      );
      drawConstructionFocus(ctx, api, 'bias-variance', () =>
        drawConstructionEquation(
          ctx,
          api,
          `\\mathrm{Bias}^2 + \\mathrm{Var}(\\hat f) + \\sigma^2_\\epsilon = ${bias.toFixed(2)}+${variance.toFixed(2)}+${noise.toFixed(2)}=${(bias + variance + noise).toFixed(2)}`,
          960,
          980,
          41,
          themeColors.green,
        ),
      );
    } else {
      drawConstructionText(
        ctx,
        api,
        'Declared toy rule · missing → review · numeric x ≤ 1 → automatic',
        960,
        315,
        31,
        themeColors.muted,
      );
      const miss = currentBeat === 0 || api.focus.progress('densify-missing', cueProgress()) < 1,
        inputs = [
          ['M1', miss ? 'missing' : '0'],
          ['M2', '0'],
        ];
      inputs.forEach(([id, v], i) => {
        const x = 520 + i * 880;
        drawConstructionText(ctx, api, id, x, 450, 45, themeColors.cyan);
        drawConstructionFocus(ctx, api, i ? 'stored-zero' : 'missing-value', () => {
          api.rect(ctx, x - 150, 520, 300, 130, themeColors.panel, themeColors.yellow, 3);
          drawConstructionText(ctx, api, v, x, 600, 46, themeColors.yellow);
        });
        api.arrow(ctx, x, 680, x, 800, themeColors.muted, 4);
        drawConstructionText(
          ctx,
          api,
          v === 'missing' ? 'review' : 'automatic',
          x,
          880,
          40,
          v === 'missing' ? themeColors.pink : themeColors.blue,
        );
      });
      drawConstructionText(
        ctx,
        api,
        miss
          ? 'M1 has no stored support value.'
          : 'M1 now holds a stored zero and takes the automatic branch.',
        960,
        1010,
        31,
        themeColors.yellow,
      );
    }
    return;
  }
  return;
}
export default {
  id: 'missing-contract',
  draw: drawMissingContract,
  cues: ['densify-missing'],
};
