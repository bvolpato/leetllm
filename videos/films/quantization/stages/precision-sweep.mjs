import { precisionExperiment } from '../arithmetic.mjs';
import { detailProgress } from '../construction.mjs';
import { drawDetailLine, drawDetailText, drawFooter, drawRow, formatValue } from '../defaults.mjs';
export function drawPrecisionSweep(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'precision-sweep', beat);
  const body = () => {
    const experiments = [2, 4, 8].map(precisionExperiment);
    if (beat === 2) {
      drawDetailText(ctx, api, 'Code bytes for 4 weights', 570, 322, 48, themeColors.ink);
      drawDetailText(ctx, api, 'Mean squared output error', 1230, 322, 43, themeColors.ink);
      experiments.forEach(({ bits, payload, mse }, i) => {
        const y = 454 + i * 187;
        const color = [themeColors.pink, themeColors.cyan, themeColors.green][i];
        drawDetailText(ctx, api, bits + ' bits / weight', 145, y + 38, 41, color);
        for (let byte = 0; byte < payload; byte++) {
          api.rect(ctx, 570 + byte * 124, y - 23, 115, 77, color, undefined, 5);
        }
        drawDetailText(ctx, api, payload + (payload === 1 ? ' byte' : ' bytes'), 570, y + 101, 33, color);
        drawDetailText(ctx, api, mse.toFixed(6), 1230, y + 38, 58, color);
      });
      drawFooter(ctx, api, 'Same three held-out inputs   ·   grids simulated in floating point');
      return;
    }
    drawDetailText(
      ctx,
      api,
      'Fixed weights [0.3, −1.2, 2, 0.7] · same 3 held-out columns',
      960,
      285,
      33,
      themeColors.ink,
      'center',
    );
    experiments.forEach((f, i) => {
      const x = 370 + i * 590,
        color = [themeColors.pink, themeColors.cyan, themeColors.green][i];
      drawDetailText(
        ctx,
        api,
        (beat === 0 && progress < 1 ? 'rounding to ' : '') + f.bits + ' bits',
        x,
        385,
        39,
        color,
        'center',
      );
      f.restored.forEach((v, j) => {
        const original = f.weights[j],
          shown = beat === 0 ? original + (v - original) * progress : v,
          y = 465 + j * 92;
        drawDetailLine(ctx, api, x - 130, y, x + 130, y, themeColors.muted);
        drawDetailLine(ctx, api, x, y - 7, x, y + 7, themeColors.muted);
        api.circle(ctx, x + original * 55, y, 5, themeColors.muted);
        api.circle(ctx, x + shown * 55, y, 9, color);
        drawDetailText(
          ctx,
          api,
          formatValue(ctx, api, shown),
          x + 190,
          y + 10,
          28,
          color,
          'center',
        );
      });
      if (beat > 0) {
        drawDetailText(
          ctx,
          api,
          beat === 1 && progress < 1 ? 'building residuals' : 'residuals',
          x,
          875,
          28,
          themeColors.muted,
          'center',
        );
        drawRow(
          ctx,
          api,
          f.residuals.map((v) => formatValue(ctx, api, v * (beat === 1 ? progress : 1))),
          x - 140,
          930,
          color,
          140,
          26,
        );
      }
    });
    if (beat > 0)
      experiments.forEach((f, i) =>
        drawDetailText(
          ctx,
          api,
          progress === 1 || beat > 1
            ? 'MSE ' + f.mse.toFixed(6) + ' · ' + f.payload + ' code B'
            : 'MSE ?',
          370 + i * 590,
          350,
          28,
          [themeColors.pink, themeColors.cyan, themeColors.green][i],
          'center',
        ),
      );
    drawFooter(ctx, api, 'Grey dot = source weight   ·   colored dot = reconstructed weight');
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'precision-sweep'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'precision-sweep',
  draw: drawPrecisionSweep,
  cues: ['precision-sweep-build-0', 'precision-sweep-build-1', 'precision-sweep-build-2'],
};
