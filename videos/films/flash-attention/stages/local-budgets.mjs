import { flashExtensionFrame, tileInventory } from '../model.mjs';
import {
  drawFlashExtensionEquation,
  drawFlashExtensionFooter,
  drawFlashExtensionL,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawLocalBudgets(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('local-budgets', state),
    currentBeat = f.beat,
    progress = f.progress;
  const paint = () => {
    if (currentBeat === 0) {
      const layers = [
        {
          x: 210,
          y: 390,
          w: 390,
          h: 340,
          title: 'CPU DRAM',
          color: themeColors.muted,
        },
        {
          x: 720,
          y: 390,
          w: 410,
          h: 340,
          title: 'GPU HBM',
          color: themeColors.blue,
        },
        {
          x: 1250,
          y: 390,
          w: 450,
          h: 340,
          title: 'ONE SM',
          color: themeColors.cyan,
        },
      ];
      for (const a of layers) {
        drawFlashExtensionRectangle(ctx, api, a.x, a.y, a.w, a.h, themeColors.panel, a.color);
        drawFlashExtensionText(ctx, api, a.title, a.x + a.w / 2, a.y + 55, 32, a.color, 'center');
      }
      drawFlashExtensionL(
        ctx,
        api,
        [
          {
            x: 610,
            y: 550,
          },
          {
            x: 700,
            y: 550,
          },
        ],
        themeColors.muted,
        5,
      );
      drawFlashExtensionL(
        ctx,
        api,
        [
          {
            x: 1140,
            y: 550,
          },
          {
            x: 1230,
            y: 550,
          },
        ],
        themeColors.blue,
        5,
      );
      drawFlashExtensionText(ctx, api, 'system link', 650, 800, 25, themeColors.muted, 'center');
      drawFlashExtensionText(ctx, api, 'HBM link', 1180, 800, 25, themeColors.blue, 'center');
      drawFlashExtensionText(
        ctx,
        api,
        '80 GB · 3.35 TB/s',
        925,
        620,
        28,
        themeColors.blue,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        'shared: 228 KiB / SM',
        1475,
        530,
        27,
        themeColors.cyan,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        '≤227 KiB / block',
        1475,
        590,
        27,
        themeColors.cyan,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        'registers: 256 KiB',
        1475,
        660,
        27,
        themeColors.yellow,
        'center',
      );
    } else {
      const inv = tileInventory(128, 128, 64),
        parts = [
          ['Q', inv.q, themeColors.blue],
          ['K', inv.k, themeColors.cyan],
          ['V', inv.v, themeColors.green],
          ['O FP32', inv.o, themeColors.yellow],
          ['scores FP32', inv.s, themeColors.pink],
        ],
        scale = 8;
      let cursor = 280;
      for (const [name, bytes, color] of parts) {
        const width = (bytes / 1024) * scale;
        drawFlashExtensionRectangle(ctx, api, cursor, 475, width, 165, color);
        drawFlashExtensionText(
          ctx,
          api,
          name,
          cursor + width / 2,
          430,
          name.length > 5 ? 25 : 31,
          color,
          'center',
        );
        drawFlashExtensionText(
          ctx,
          api,
          bytes / 1024 + ' KiB',
          cursor + width / 2,
          700,
          28,
          color,
          'center',
        );
        cursor += width;
      }
      drawFlashExtensionEquation(
        ctx,
        api,
        '16+16+16+32+64=144\\ \\mathrm{KiB}',
        960,
        835,
        43,
        themeColors.yellow,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        'Working set for one 128-row tile',
        960,
        300,
        34,
        themeColors.ink,
        'center',
      );
    }
    drawFlashExtensionFooter(
      ctx,
      api,
      'Each SM has its own shared-memory and register budgets',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('local-budgets-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'local-budgets',
  draw: drawLocalBudgets,
  cues: [
    'local-budgets-beat-1',
    'local-budgets-beat-2',
    'fa-tile-inventory',
    'local-budgets-beat-3',
  ],
};
