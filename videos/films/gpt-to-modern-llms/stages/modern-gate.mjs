import { clamp, phase, phraseEnded } from '../arithmetic.mjs';
import {
  drawModernArrow,
  drawModernEquation,
  drawModernFocus,
  drawModernRect,
  drawModernStamp,
  drawModernText,
} from '../defaults.mjs';
export function drawModernGate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = clamp(state.beatP ?? 0);
  const progress = (id, a = 0.12, z = 0.72) => api.focus.progress(id, phase(progress2, a, z));
  {
    if (currentBeat < 2) {
      const input = currentBeat === 0 ? 0 : progress('open-gate'),
        gate = input / (1 + Math.exp(-input)),
        value = 4 * gate;
      drawModernText(
        ctx,
        api,
        'Two learned projections · one elementwise gate',
        960,
        300,
        34,
        themeColors.muted,
      );
      drawModernFocus(ctx, api, 'gate-input', () => {
        drawModernStamp(ctx, api, input.toFixed(2), 400, 530, themeColors.yellow);
        drawModernEquation(ctx, api, 'SiLU(x)=x\\,\\sigma(x)', 600, 390, 40, themeColors.yellow);
      });
      drawModernFocus(ctx, api, 'open-gate', () => {
        drawModernRect(ctx, api, 700, 780 - gate * 95, 140, gate * 95, themeColors.yellow);
        drawModernText(ctx, api, gate.toFixed(3), 770, 840, 40, themeColors.yellow);
      });
      drawModernRect(ctx, api, 1020, 400, 140, 380, themeColors.blue);
      drawModernText(ctx, api, '4.00', 1090, 840, 40, themeColors.blue);
      drawModernText(ctx, api, 'up branch', 1090, 345, 30, themeColors.blue);
      drawModernText(ctx, api, '×', 930, 600, 75);
      drawModernArrow(ctx, api, [1220, 590], [1340, 590], themeColors.cyan);
      drawModernFocus(ctx, api, 'gate-product', () => {
        drawModernRect(ctx, api, 1430, 780 - value * 95, 160, value * 95, themeColors.green);
        drawModernText(ctx, api, value.toFixed(3), 1510, 840, 43, themeColors.green);
      });
      drawModernEquation(
        ctx,
        api,
        `4\\times SiLU(${input.toFixed(2)})=${value.toFixed(2)}`,
        960,
        980,
        50,
        themeColors.green,
      );
    } else {
      const d = 12,
        width = 48,
        ordinary = 2 * d * width,
        gatedWidth = ordinary / (3 * d);
      const settled = currentBeat === 3 && phraseEnded(state, 'matched-width', 0.43);
      drawModernText(
        ctx,
        api,
        'Model width 12 · each area counts matrix weights, biases omitted',
        960,
        302,
        33,
        themeColors.muted,
      );
      drawModernFocus(ctx, api, 'gate-matrix-budget', () => {
        drawModernText(ctx, api, 'Ordinary', 290, 480, 39);
        drawModernText(ctx, api, 'SwiGLU', 290, 765, 39);
        for (const [row, count] of [
          [0, 2],
          [1, 3],
        ]) {
          const y = row ? 700 : 420;
          for (let i = 0; i < count; i++) {
            const x = 530 + i * 400;
            if (row && !settled) {
              drawModernText(ctx, api, '12 × ?', x + 125, y + 58, 40, themeColors.yellow);
            } else {
              const w = row ? gatedWidth : width;
              drawModernRect(
                ctx,
                api,
                x,
                y,
                w * 7,
                d * 7,
                row ? themeColors.green : themeColors.blue,
              );
              drawModernText(ctx, api, String(w), x + w * 3.5, y + 135, 34, themeColors.ink);
            }
          }
        }
      });
      drawModernEquation(
        ctx,
        api,
        settled ? '3\\times12\\times32=1152' : '2\\times12\\times48=1152',
        960,
        976,
        46,
        themeColors.yellow,
      );
    }
  }
}
export default {
  id: 'modern-gate',
  draw: drawModernGate,
  cues: ['gate-input', 'open-gate', 'matrix-budget', 'matched-width'],
};
