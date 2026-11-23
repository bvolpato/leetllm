import { clamp01 } from '../arithmetic.mjs';
import { detailProgress } from '../construction.mjs';
import { drawDetailArrow, drawDetailRectangle, drawDetailText, drawFooter } from '../defaults.mjs';
export function drawContainerLayout(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'container-layout', beat);
  const body = () => {
    drawDetailText(
      ctx,
      api,
      'GGUF · schematic file layout with variable section lengths',
      960,
      290,
      34,
      themeColors.ink,
      'center',
    );
    const segments = [
      ['header', 230, 230, themeColors.blue],
      ['typed metadata', 460, 470, themeColors.yellow],
      ['tensor descriptors', 930, 510, themeColors.cyan],
      ['aligned data', 1440, 300, themeColors.pink],
    ];
    segments.forEach(([label, x, w, color]) => {
      drawDetailRectangle(ctx, api, x, 430, w - 12, 135, color);
      drawDetailText(ctx, api, label, x + (w - 12) / 2, 645, 30, color, 'center');
    });
    if (beat === 0) {
      drawDetailText(
        ctx,
        api,
        'tensor name · dimensions · encoding · payload offset',
        960,
        800,
        38,
        themeColors.cyan,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        'architecture + tokenizer + template metadata',
        960,
        905,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      const phases = ['mapped address range', 'resident host pages', 'discrete GPU transfer'];
      phases.forEach((label, i) => {
        const x = 420 + i * 560;
        drawDetailText(
          ctx,
          api,
          label,
          x,
          785,
          29,
          [themeColors.blue, themeColors.cyan, themeColors.pink][i],
          'center',
        );
        for (let k = 0; k < 5; k++) {
          const amount = clamp01(progress * 3 - i),
            active = k < Math.ceil(amount * 5);
          drawDetailRectangle(
            ctx,
            api,
            x - 150 + k * 65,
            840,
            48,
            60,
            active ? [themeColors.blue, themeColors.cyan, themeColors.pink][i] : themeColors.panel,
          );
        }
        if (i < 2) drawDetailArrow(ctx, api, x + 190, 870, x + 330, 870, themeColors.muted);
      });
      drawDetailText(
        ctx,
        api,
        'default alignment: 32 bytes · metadata may override',
        960,
        355,
        30,
        themeColors.yellow,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'A compatible reader still needs architecture, key, encoding and version support',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'container-layout'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'container-layout',
  draw: drawContainerLayout,
  cues: ['container-layout-build-0', 'container-layout-build-1'],
};
