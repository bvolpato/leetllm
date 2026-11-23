import { clamp, phase } from '../arithmetic.mjs';
import {
  drawModernArrow,
  drawModernEquation,
  drawModernFocus,
  drawModernRect,
  drawModernText,
} from '../defaults.mjs';
export function drawModernNorm(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = clamp(state.beatP ?? 0);
  const progress = (id, a = 0.12, z = 0.72) => api.focus.progress(id, phase(progress2, a, z));
  {
    const rms = Math.sqrt(12.5),
      square = currentBeat === 0 ? progress('rms-square') : 1,
      average = currentBeat === 0 ? progress('rms-average') : 1,
      root = currentBeat === 0 ? progress('rms-root') : 1,
      divide = currentBeat === 0 ? 0 : currentBeat > 1 ? 1 : progress('rms-divide'),
      revealed = currentBeat > 1 || (currentBeat === 1 && progress('rms-result') === 1),
      scale = api.lerp(1, 1 / rms, divide),
      v = [3, 4].map((x) => x * scale);
    if (currentBeat < 2)
      drawModernText(
        ctx,
        api,
        'One position · features [3, 4] · unit gains · epsilon omitted',
        960,
        300,
        30,
        themeColors.muted,
      );
    if (currentBeat === 2) {
      const rmsValues = [3 / rms, 4 / rms];
      drawModernText(
        ctx,
        api,
        'Same input [3, 4] · unit gains · zero bias · epsilon omitted',
        960,
        313,
        32,
        themeColors.muted,
      );
      for (const [j, pair] of [
        [0, rmsValues],
        [1, [-1, 1]],
      ]) {
        const x = 450 + j * 850,
          base = 670;
        drawModernText(ctx, api, j ? 'LayerNorm' : 'RMSNorm', x + 80, 410, 44, themeColors.ink);
        api.line(ctx, x - 140, base, x + 300, base, themeColors.muted, 3);
        pair.forEach((n, i) => {
          const left = x - 83 + i * 178;
          drawModernRect(
            ctx,
            api,
            left,
            n < 0 ? base : base - n * 150,
            100,
            Math.abs(n) * 150,
            i ? themeColors.cyan : themeColors.blue,
          );
          drawModernText(ctx, api, n.toFixed(3), left + 50, n < 0 ? base + 197 : base + 56, 35);
        });
      }
      drawModernFocus(ctx, api, 'rms-output', () =>
        drawModernText(
          ctx,
          api,
          'Centering subtracts 3.5 from each feature before division',
          960,
          986,
          37,
          themeColors.yellow,
        ),
      );
      return;
    }
    [3, 4].forEach((x, i) => {
      const at = 370 + i * 260;
      drawModernRect(
        ctx,
        api,
        at - 70,
        800 - x * 80,
        140,
        x * 80,
        i ? themeColors.cyan : themeColors.blue,
      );
      drawModernText(ctx, api, x, at, 850, 34);
    });
    drawModernFocus(ctx, api, 'rms-statistic', () => {
      if (root === 1)
        drawModernEquation(
          ctx,
          api,
          'RMS=\\sqrt{12.5}\\approx3.536',
          960,
          375,
          42,
          themeColors.yellow,
        );
      else if (square === 1)
        drawModernEquation(ctx, api, '[3^2,4^2]=[9,16]', 960, 375, 42, themeColors.yellow);
      else drawModernText(ctx, api, 'Square each input feature', 960, 375, 35, themeColors.yellow);
      if (average === 1)
        drawModernEquation(ctx, api, '(9+16)/2=12.5', 960, 440, 40, themeColors.yellow);
      else drawModernText(ctx, api, 'Mean-square pending', 960, 440, 30, themeColors.muted);
      [3, 4].forEach((x, i) => {
        const side = x * 30 * square,
          left = 800 + i * 145;
        drawModernRect(
          ctx,
          api,
          left,
          620 - side,
          side,
          side,
          i ? themeColors.cyan : themeColors.blue,
        );
        if (square === 1)
          drawModernText(ctx, api, String(x * x), left + side / 2, 575, 29, themeColors.bg);
      });
    });
    drawModernFocus(ctx, api, 'rms-divide', () => {
      if (currentBeat > 0)
        v.forEach((x, i) => {
          const at = 1260 + i * 260;
          drawModernRect(
            ctx,
            api,
            at - 70,
            800 - x * 80,
            140,
            x * 80,
            i ? themeColors.cyan : themeColors.blue,
          );
          drawModernText(ctx, api, revealed ? x.toFixed(3) : '…', at, 850, 34, themeColors.green);
        });
    });
    if (root === 1) drawModernArrow(ctx, api, [730, 675], [910, 675], themeColors.yellow);
    drawModernText(
      ctx,
      api,
      root === 1 ? 'RMS divisor ready' : 'Construct the divisor',
      960,
      735,
      28,
      themeColors.yellow,
    );
    drawModernFocus(ctx, api, 'rms-output', () => {
      if (currentBeat === 0)
        drawModernText(
          ctx,
          api,
          'Normalize after the divisor is established',
          960,
          975,
          32,
          themeColors.muted,
        );
      else
        drawModernEquation(
          ctx,
          api,
          currentBeat < 2
            ? revealed
              ? '[3,4]/\\sqrt{12.5}\\approx[0.849,1.131]'
              : '[3,4]/3.536=?'
            : 'LayerNorm:[-1,1]\\qquad RMSNorm:[0.849,1.131]',
          960,
          975,
          currentBeat < 2 ? 43 : 36,
          themeColors.ink,
        );
    });
  }
}
export default {
  id: 'modern-norm',
  draw: drawModernNorm,
  cues: ['rms-square', 'rms-average', 'rms-root', 'rms-divide', 'rms-result', 'norm-limits'],
};
