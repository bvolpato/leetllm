import { detailProgress } from '../construction.mjs';
import {
  drawDetailEquation,
  drawDetailRectangle,
  drawDetailText,
  drawFooter,
  formatValue,
} from '../defaults.mjs';
export function drawPrecisionRoles(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'precision-roles', beat);
  const body = () => {
    if (beat !== 1) {
      const owners = [
        {
          name: 'weights',
          bits: 'W4',
          color: themeColors.blue,
        },
        {
          name: 'activations',
          bits: 'A16',
          color: themeColors.cyan,
        },
        {
          name: 'attention cache',
          bits: 'independent dtype',
          color: themeColors.pink,
        },
      ];
      owners.forEach((o, i) => {
        const x = 400 + i * 560;
        drawDetailText(ctx, api, o.name, x, 350, 36, o.color, 'center');
        for (let n = 0; n < 5; n++)
          drawDetailRectangle(
            ctx,
            api,
            x - 145 + n * 60,
            450,
            45,
            beat === 2 && i === 2 ? 180 : 120,
            o.color,
          );
        drawDetailText(ctx, api, o.bits, x, 750, 40, o.color, 'center');
      });
      if (beat === 2) {
        drawDetailText(
          ctx,
          api,
          'vLLM guide inspected 2026-11-06',
          960,
          285,
          30,
          themeColors.yellow,
          'center',
        );
        drawDetailText(
          ctx,
          api,
          'FP8 per-head scales: documented Flash Attention + calibration path',
          960,
          890,
          32,
          themeColors.yellow,
          'center',
        );
      } else
        drawDetailText(
          ctx,
          api,
          'W8A8 / W4A4 / FP8: supported arithmetic paths need their own quality checks',
          960,
          900,
          31,
          themeColors.ink,
          'center',
        );
    } else {
      const s = 1 + 3 * progress,
        weight = 0.3 * s,
        input = 10 / s;
      drawDetailText(
        ctx,
        api,
        'Equivalent paired rescaling before quantization',
        960,
        295,
        35,
        themeColors.ink,
        'center',
      );
      for (const [i, label, value, max, color] of [
        [0, 'weight', weight, 1.2, themeColors.blue],
        [1, 'activation', input, 10, themeColors.cyan],
      ]) {
        const x = 400 + i * 830;
        drawDetailText(ctx, api, label, x, 400, 34, color, 'center');
        drawDetailRectangle(ctx, api, x - 150, 500, (300 * value) / max, 100, color);
        drawDetailText(ctx, api, formatValue(ctx, api, value), x, 720, 52, color, 'center');
      }
      drawDetailEquation(ctx, api, '(0.3s)\\,(10/s)=3', 960, 900, 60, themeColors.green);
    }
    drawFooter(
      ctx,
      api,
      'SmoothQuant moves channel range difficulty before W8A8 · runtime graph and finite precision still matter',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'precision-roles'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'precision-roles',
  draw: drawPrecisionRoles,
  cues: ['precision-roles-build-0', 'precision-roles-build-1', 'precision-roles-build-2'],
};
