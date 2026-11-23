import { detailProgress, extraProgress } from '../construction.mjs';
import {
  drawAxis,
  drawDetailEquation,
  drawDetailRectangle,
  drawDetailText,
  drawEarnedNumber,
  drawFooter,
  drawRow,
  fadeDetail,
} from '../defaults.mjs';
export function drawQ4kUnpack(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'q4k-unpack', beat);
  const body = () => {
    if (beat === 0) {
      drawDetailText(
        ctx,
        api,
        '256 weights · 8 sub-blocks × 32',
        960,
        300,
        37,
        themeColors.ink,
        'center',
      );
      const codes = extraProgress(state, 'q4k-code-owners', progress),
        coefficients = extraProgress(state, 'q4k-coefficients', progress),
        factors = extraProgress(state, 'q4k-super-factors', progress);
      for (let i = 0; i < 8; i++) {
        const x = 240 + i * 190;
        for (let j = 0; j < 32; j++)
          if (i * 32 + j < Math.ceil(codes * 256))
            drawDetailRectangle(
              ctx,
              api,
              x + (j % 8) * 16,
              425 + Math.floor(j / 8) * 24,
              12,
              16,
              themeColors.cyan,
            );
        drawDetailText(ctx, api, '32 codes', x + 62, 565, 26, themeColors.cyan, 'center');
        drawDetailRectangle(ctx, api, x, 635, 124 * coefficients, 40, themeColors.yellow);
        drawDetailText(ctx, api, '6 + 6 bits', x + 62, 730, 26, themeColors.yellow, 'center');
      }
      fadeDetail(ctx, api, factors, () =>
        drawDetailText(
          ctx,
          api,
          '2 FP16 factors · 4 bytes',
          960,
          795,
          28,
          themeColors.pink,
          'center',
        ),
      );
      drawDetailText(
        ctx,
        api,
        '128 code B + 12 coefficient B + 4 FP16-factor B',
        960,
        835,
        36,
        themeColors.ink,
        'center',
      );
      drawEarnedNumber(
        ctx,
        api,
        '144 × 8 / 256 = 4.5 bits/weight',
        960,
        935,
        progress === 1,
        themeColors.green,
        43,
      );
    } else if (beat === 1) {
      drawDetailEquation(ctx, api, '\\hat{w}=d\\,s\\,q-d_{\\min}m', 960, 330, 64, themeColors.ink);
      drawRow(
        ctx,
        api,
        ['d = 0.1', 's = 3', 'q = 5', 'dmin = 0.2', 'm = 2'],
        340,
        495,
        themeColors.cyan,
        310,
        32,
      );
      const positive = 1.5 * progress,
        offset = 0.4 * progress;
      drawDetailText(
        ctx,
        api,
        'reconstructed real value',
        960,
        585,
        28,
        themeColors.muted,
        'center',
      );
      drawAxis(ctx, api, 320, 805, 1280, 2, '');
      drawDetailRectangle(ctx, api, 320, 650, (positive / 2) * 1280, 55, themeColors.cyan);
      drawDetailRectangle(
        ctx,
        api,
        320 + ((positive - offset) / 2) * 1280,
        720,
        (offset / 2) * 1280,
        40,
        themeColors.pink,
      );
      drawEarnedNumber(
        ctx,
        api,
        '1.5 − 0.4 = 1.1',
        960,
        935,
        progress === 1,
        themeColors.green,
        56,
      );
    } else {
      drawDetailText(
        ctx,
        api,
        'Q4_K tensor encoding · Q4_K_M model preset',
        960,
        310,
        35,
        themeColors.ink,
        'center',
        'mono',
      );
      const types = ['Q4_K', 'Q4_K', 'Q6_K', 'Q4_K', 'Q6_K', 'F32'];
      types.forEach((s, i) => {
        const x = 280 + i * 280,
          color =
            s === 'Q4_K' ? themeColors.cyan : s === 'Q6_K' ? themeColors.pink : themeColors.yellow;
        drawDetailRectangle(ctx, api, x - 95, 470, 190, 160, color);
        drawDetailText(ctx, api, s, x, 730, 34, color, 'center', 'mono');
      });
      drawDetailText(
        ctx,
        api,
        'Illustrative emitted inventory: selected tensors use different types',
        960,
        865,
        32,
        themeColors.ink,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        'Inspect actual tensor inventory and loader support',
        960,
        955,
        31,
        themeColors.yellow,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'The minimum term is subtracted · an integer code zero-point is a different reconstruction contract',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'q4k-unpack'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'q4k-unpack',
  draw: drawQ4kUnpack,
  cues: [
    'q4k-unpack-build-0',
    'q4k-code-owners',
    'q4k-coefficients',
    'q4k-super-factors',
    'q4k-unpack-build-1',
    'q4k-unpack-build-2',
  ],
};
