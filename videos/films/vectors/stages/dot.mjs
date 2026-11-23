import { H, P } from '../fixtures.mjs';
import { dotFrame } from '../model.mjs';
import {
  drawEquation,
  drawMatrix,
  drawRow,
  drawTarget,
  drawText,
  formatNumber,
} from '../defaults.mjs';
export function drawDot(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = dotFrame(state),
      color = [themeColors.blue, themeColors.pink];
    drawText(ctx, api, 'password · input row', 430, 295, 32, themeColors.cyan, 'center');
    drawRow(ctx, api, H[0][2], 290, 350, themeColors.cyan, 140);
    drawText(ctx, api, 'third matrix column', 1030, 295, 32, themeColors.yellow, 'center');
    drawTarget(ctx, api, 'dot-column', () =>
      drawMatrix(
        ctx,
        api,
        P.map((r) => [r[2]]),
        970,
        350,
        themeColors.yellow,
        120,
      ),
    );
    const parts = [f.first, f.second],
      scaleX = 920;
    parts.forEach((amount, i) =>
      drawTarget(ctx, api, i ? 'dot-second-product' : 'dot-first-product', () => {
        const y = 715 + i * 95;
        drawEquation(ctx, api, 'x_' + (i + 1) + 'P_{' + (i + 1) + ',3}', 380, y + 28, 36, color[i]);
        api.rect(
          ctx,
          590,
          y,
          Math.max(0.01, f.products[i] * amount * 920),
          38,
          color[i],
          undefined,
          5,
        );
        drawText(
          ctx,
          api,
          formatNumber(f.products[i] * amount),
          1120,
          y + 29,
          30,
          color[i],
          'right',
        );
      }),
    );
    drawTarget(ctx, api, 'dot-accumulator', () => {
      drawText(ctx, api, 'accumulated third output', 1480, 350, 29, themeColors.green, 'center');
      api.rect(ctx, 1360, 420, 45, 370, themeColors.panel, themeColors.muted, 1);
      const h = (f.accumulated / 0.5) * 370;
      if (h > 0) api.rect(ctx, 1360, 790 - h, 45, h, themeColors.green);
      drawEquation(ctx, api, formatNumber(f.accumulated), 1540, 630, 55, themeColors.green);
      drawText(ctx, api, '0', 1330, 800, 27, themeColors.muted, 'right');
      drawText(ctx, api, '0.5', 1330, 435, 27, themeColors.muted, 'right');
    });
    if (beat === 2) {
      drawTarget(ctx, api, 'full-output', () =>
        drawRow(ctx, api, f.output, 380, 915, themeColors.cyan, 140),
      );
      drawTarget(ctx, api, 'dependent-output', () =>
        drawEquation(ctx, api, 'y_3=(y_1+y_2)/2', 1320, 955, 42, themeColors.cyan),
      );
    } else drawEquation(ctx, api, 'y_3=x_1P_{1,3}+x_2P_{2,3}', 960, 980, 44, themeColors.ink);
  }
}
export default {
  id: 'dot',
  draw: drawDot,
  cues: ['dot-first', 'dot-second', 'output-relation'],
};
