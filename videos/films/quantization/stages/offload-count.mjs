import { trailingPlacement } from '../arithmetic.mjs';
import { detailProgress } from '../construction.mjs';
import {
  drawDetailArrow,
  drawDetailRectangle,
  drawDetailText,
  drawEarnedNumber,
  drawFooter,
} from '../defaults.mjs';
export function drawOffloadCount(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'offload-count', beat);
  const body = () => {
    if (beat === 0) {
      const placement = trailingPlacement(40, 24);
      drawDetailText(
        ctx,
        api,
        'Pinned contract · 40 repeating blocks · request 24 GPU slots',
        960,
        290,
        33,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 40; i++) {
        const x = 220 + (i % 20) * 75,
          y = 430 + Math.floor(i / 20) * 150,
          color = i >= placement.start ? themeColors.blue : themeColors.cyan;
        drawDetailRectangle(ctx, api, x, y, 55, 72, color);
        drawDetailText(ctx, api, i, x + 27.5, y + 115, 25, color, 'center');
      }
      drawDetailText(ctx, api, 'input: CPU', 390, 855, 33, themeColors.cyan, 'center');
      drawEarnedNumber(
        ctx,
        api,
        '23 blocks + output = 24 GPU slots',
        1190,
        855,
        progress === 1,
        themeColors.blue,
        37,
      );
      drawDetailText(ctx, api, 'start = 40 + 1 − 24 = 17', 960, 965, 36, themeColors.ink, 'center');
    } else if (beat === 1) {
      const sizes = [1000, 2000, 1500, 500],
        left = 350,
        scale = 1200 / 6000;
      drawDetailText(
        ctx,
        api,
        'Hypothetical 6000 MB device · 2000 MB reserved',
        960,
        310,
        35,
        themeColors.ink,
        'center',
      );
      drawDetailRectangle(ctx, api, left, 450, 2000 * scale, 80, themeColors.yellow);
      let x = left + 2000 * scale;
      for (const i of [3, 2, 1]) {
        drawDetailRectangle(ctx, api, x, 450, sizes[i] * scale, 80, themeColors.blue);
        drawDetailText(
          ctx,
          api,
          'block ' + i,
          x + (sizes[i] * scale) / 2,
          635,
          30,
          themeColors.blue,
          'center',
        );
        x += sizes[i] * scale;
      }
      drawDetailText(ctx, api, 'reserve', left + 200, 635, 30, themeColors.yellow, 'center');
      drawDetailText(
        ctx,
        api,
        'GPU payload: 500 + 1500 + 2000 = 4000 MB',
        960,
        780,
        37,
        themeColors.blue,
        'center',
      );
      drawEarnedNumber(
        ctx,
        api,
        'block 0 · 1000 MB stays CPU',
        960,
        915,
        progress === 1,
        themeColors.cyan,
        42,
      );
    } else {
      drawDetailText(
        ctx,
        api,
        'Split execution adds a transport boundary',
        960,
        310,
        36,
        themeColors.ink,
        'center',
      );
      const y = 565;
      drawDetailText(ctx, api, 'CPU blocks', 400, y - 105, 37, themeColors.cyan, 'center');
      drawDetailText(ctx, api, 'GPU blocks', 1500, y - 105, 37, themeColors.blue, 'center');
      drawDetailRectangle(ctx, api, 240, y, 320, 100, themeColors.cyan);
      drawDetailRectangle(ctx, api, 1340, y, 320, 100, themeColors.blue);
      drawDetailArrow(ctx, api, 620, y + 50, 1280, y + 50, themeColors.yellow);
      if (progress > 0 && progress < 1)
        api.circle(ctx, 620 + 660 * progress, y + 50, 13, themeColors.yellow);
      drawDetailText(
        ctx,
        api,
        'activations cross the boundary',
        960,
        790,
        36,
        themeColors.yellow,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        'placement ≠ Tensor Core dispatch',
        960,
        925,
        34,
        themeColors.ink,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Versioned source controls counting · allocation logs, overrides and actual workload control deployment',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'offload-count'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'offload-count',
  draw: drawOffloadCount,
  cues: ['offload-count-build-0', 'offload-count-build-1', 'offload-count-build-2'],
};
