import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionDot,
  drawFlashExtensionFooter,
  drawFlashExtensionL,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawPagedContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('paged-contract', state),
    currentBeat = f.beat,
    progress = f.progress;
  const paint = () => {
    const ids = [6, 1, 7, 3, 0, 5, 2, 4];
    drawFlashExtensionText(
      ctx,
      api,
      'Logical tokens stay in order across scattered physical pages',
      960,
      285,
      36,
      themeColors.ink,
      'center',
    );
    for (let i = 0; i < 8; i++) {
      const x = 240 + i * 190;
      drawFlashExtensionRectangle(ctx, api, x, 390, 150, 75, themeColors.panel, themeColors.blue);
      drawFlashExtensionText(ctx, api, 'L' + i, x + 75, 438, 30, themeColors.blue, 'center');
      drawFlashExtensionRectangle(ctx, api, x, 730, 150, 75, themeColors.panel, themeColors.cyan);
      drawFlashExtensionText(ctx, api, 'P' + i, x + 75, 778, 30, themeColors.cyan, 'center');
      const end = 240 + ids[i] * 190 + 75;
      const active = Math.min(7, Math.floor(progress * 8)),
        fraction = progress === 1 ? 1 : progress * 8 - active;
      drawFlashExtensionL(
        ctx,
        api,
        [
          {
            x: x + 75,
            y: 480,
          },
          {
            x: end,
            y: 700,
          },
        ],
        i === active ? themeColors.yellow : themeColors.muted,
        i === active ? 5 : 2,
      );
      if (i === active) {
        const at = api.pointAlongPath(
          [
            {
              x: x + 75,
              y: 480,
            },
            {
              x: end,
              y: 700,
            },
          ],
          fraction,
        );
        drawFlashExtensionDot(ctx, api, at.x, at.y, themeColors.yellow, 11);
      }
    }
    drawFlashExtensionText(
      ctx,
      api,
      '16-token allocator page (schematic)',
      960,
      335,
      28,
      themeColors.blue,
      'center',
    );
    drawFlashExtensionText(
      ctx,
      api,
      '128-token read tile follows eight logical mappings',
      960,
      900,
      33,
      themeColors.yellow,
      'center',
    );
    drawFlashExtensionFooter(
      ctx,
      api,
      'For the FlashAttention inference cache API, choose a page size divisible by 256',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('paged-contract-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'paged-contract',
  draw: drawPagedContract,
  cues: ['paged-contract-beat-1', 'paged-contract-beat-2', 'fa-page-map', 'paged-contract-beat-3'],
};
