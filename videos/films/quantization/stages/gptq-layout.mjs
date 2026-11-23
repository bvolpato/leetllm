import { detailProgress } from '../construction.mjs';
import {
  drawDetailArrow,
  drawDetailRectangle,
  drawDetailText,
  drawFooter,
  drawRow,
} from '../defaults.mjs';
export function drawGptqLayout(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'gptq-layout', beat);
  const body = () => {
    if (beat === 0) {
      for (const [i, values] of [
        [0, [5, 5]],
        [1, [-1, 1]],
      ]) {
        const x = 350 + i * 870,
          color = i ? themeColors.cyan : themeColors.blue;
        drawRow(ctx, api, values, x, 420, color, 180, 51);
        drawDetailText(
          ctx,
          api,
          'Σx² = ' + values.reduce((s, v) => s + v * v, 0),
          x + 90,
          570,
          47,
          color,
          'center',
        );
        drawDetailText(
          ctx,
          api,
          'centered variance = ' + (i ? 1 : 0),
          x + 90,
          735,
          35,
          themeColors.muted,
          'center',
        );
        drawDetailRectangle(ctx, api, x - 70, 815, (i ? 2 : 50) * 11, 50, color);
      }
      drawDetailText(
        ctx,
        api,
        'Activation energy and centered variance rank different quantities',
        960,
        310,
        32,
        themeColors.ink,
        'center',
      );
    } else if (beat === 1) {
      drawDetailText(
        ctx,
        api,
        'Static groups keep their original owners',
        960,
        300,
        36,
        themeColors.ink,
        'center',
      );
      const order = [2, 0, 3, 1];
      for (let i = 0; i < 4; i++) {
        const owner = order[i],
          x = 410 + (i + (owner - i) * progress) * 350,
          y = 500 + Math.sin(Math.PI * progress) * (i % 2 ? 120 : -120);
        drawDetailText(
          ctx,
          api,
          'column ' + owner,
          x,
          y - 40,
          32,
          owner < 2 ? themeColors.blue : themeColors.pink,
          'center',
        );
        drawDetailRectangle(
          ctx,
          api,
          x - 90,
          y,
          180,
          90,
          owner < 2 ? themeColors.blue : themeColors.pink,
        );
        drawDetailText(
          ctx,
          api,
          'G' + Math.floor(owner / 2),
          x,
          y + 58,
          36,
          themeColors.bg,
          'center',
        );
        drawDetailText(
          ctx,
          api,
          'stored slot ' + i,
          410 + i * 350,
          820,
          30,
          themeColors.muted,
          'center',
        );
      }
      drawDetailText(
        ctx,
        api,
        'process [2, 0, 3, 1] → restore [0, 1, 2, 3]',
        960,
        925,
        37,
        themeColors.ink,
        'center',
      );
    } else {
      drawDetailText(
        ctx,
        api,
        'Versioned representation contract · 2026-11-06',
        960,
        310,
        34,
        themeColors.yellow,
        'center',
      );
      const names = [
        'saved codes + groups + zero-points',
        'supported GPTQModel loader',
        'supported actual kernel',
      ];
      names.forEach((s, i) => {
        const y = 440 + i * 190;
        drawDetailText(
          ctx,
          api,
          s,
          960,
          y,
          38,
          [themeColors.blue, themeColors.cyan, themeColors.green][i],
          'center',
        );
        if (i < 2) drawDetailArrow(ctx, api, 960, y + 45, 960, y + 120, themeColors.muted);
      });
      drawDetailText(
        ctx,
        api,
        'Asymmetric GPTQModel ≠ legacy AutoGPTQ compatibility',
        960,
        965,
        31,
        themeColors.pink,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Pinned source defines the illustrated ordering · record exporter, loader and backend revisions',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'gptq-layout'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'gptq-layout',
  draw: drawGptqLayout,
  cues: ['gptq-layout-build-0', 'gptq-layout-build-1', 'gptq-layout-build-2'],
};
