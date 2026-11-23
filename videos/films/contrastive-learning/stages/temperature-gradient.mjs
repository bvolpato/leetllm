import { formatValue } from '../arithmetic.mjs';
import { drawCells, drawNote, drawText } from '../defaults.mjs';
export function drawTemperatureGradient(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-temperature-gradient-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('temperature-gradient-mechanism', () => {
    if (currentBeat < 2) {
      drawText(
        ctx,
        api,
        'Fixed scores .90 / .20 · vary only temperature',
        960,
        285,
        35,
        themeColors.yellow,
      );
      const plot = teaching.axes({
        x: 280,
        y: 420,
        width: 1300,
        height: 350,
        xDomain: [0.01, 1],
        yDomain: [0, 0.7],
        xTicks: [0.01, 0.1, 0.5, 1],
        yTicks: [0, 0.2, 0.4, 0.6],
        xLabel: 'temperature',
        fontSize: 25,
      });
      const pts = Array.from(
        {
          length: 150,
        },
        (_, i) => {
          const tau = 0.01 + (0.99 * i) / 149,
            z = Math.exp(-0.7 / tau);
          return {
            x: tau,
            y: z / (1 + z) / tau,
          };
        },
      );
      teaching.curve({
        plot,
        points: pts,
        color: themeColors.pink,
        width: 4,
      });
      if (currentBeat === 0) {
        drawText(ctx, api, '|∂L/∂s+| = (1 − p+) / τ', 960, 930, 40, themeColors.cyan);
      } else {
        [
          [1, 'one'],
          [0.1, 'tenth'],
          [0.05, 'fifth'],
          [0.01, 'tiny'],
        ].forEach(([tau, key], i) => {
          if (resultComplete(key)) {
            const v = Math.exp(-0.7 / tau) / (1 + Math.exp(-0.7 / tau)) / tau,
              a = plot.point(tau, v);
            api.circle(ctx, a.x, a.y, 9, themeColors.pink);
            drawText(ctx, api, 'τ ' + tau, 300 + i * 440, 900, 28, themeColors.blue);
            drawText(
              ctx,
              api,
              v < 1e-8 ? v.toExponential(2) : formatValue(v, 6),
              300 + i * 440,
              955,
              31,
              themeColors.pink,
            );
          }
        });
      }
      drawNote(
        ctx,
        api,
        'Sharper already-correct rows can saturate · curve is computed from this fixed gap',
      );
    } else {
      drawText(ctx, api, 'Negative score difference / τ', 960, 300, 35, themeColors.blue);
      drawCells(ctx, api, [0.72, 0.2, 0.05], 400, 440, 390, 90, themeColors.blue);
      if (resultComplete('ratio')) {
        drawText(ctx, api, 'exp((.72 − .20) / .05)', 960, 680, 45, themeColors.cyan);
        drawText(ctx, api, '32,859.626 × gradient ratio', 960, 850, 43, themeColors.pink);
      }
      drawNote(ctx, api, 'A dominating gradient still needs a correct relevance label');
    }
  });
}
export default {
  id: 'temperature-gradient',
  draw: drawTemperatureGradient,
  cues: [
    'cl-temperature-gradient-gap',
    'cl-temperature-gradient-rule',
    'cl-temperature-gradient-one',
    'cl-temperature-gradient-tenth',
    'cl-temperature-gradient-fifth',
    'cl-temperature-gradient-tiny',
    'cl-temperature-gradient-ratio',
  ],
};
