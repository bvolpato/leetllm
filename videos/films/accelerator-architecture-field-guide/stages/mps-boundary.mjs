import { accEvent } from '../construction.mjs';
import {
  drawCard,
  drawCenteredText,
  drawFooter,
  drawLine,
  drawPanel,
  drawText,
} from '../defaults.mjs';
export function drawMpsBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('mps-boundary-mechanism', () => {
    if (currentBeat === 0) {
      drawPanel(ctx, api, 140, 340, 1640, 550, themeColors.blue);
      drawCenteredText(ctx, api, 'One shared physical pool', 960, 395, 36, themeColors.blue);
      drawCard(ctx, api, 'CPU framework device', 220, 520, 640, 180, themeColors.cyan, 36);
      drawCard(ctx, api, 'MPS GPU framework device', 1060, 520, 640, 180, themeColors.yellow, 36);
      drawLine(ctx, api, 910, 490, 910, 745, themeColors.muted, 3);
      if (B('devices', 0))
        drawCenteredText(
          ctx,
          api,
          'Shared physical memory does not select the Apple Neural Engine',
          960,
          825,
          31,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      drawCenteredText(
        ctx,
        api,
        '32 GB of unified memory   ·   example Mac',
        960,
        285,
        33,
        themeColors.yellow,
      );
      const parts = [
        ['BF16 weights', 16, themeColors.blue],
        ['KV pool', 4, themeColors.cyan],
        ['Temporaries', 3, themeColors.yellow],
        ['Runtime', 2, themeColors.pink],
        ['OS / apps', 5, themeColors.green],
      ];
      api.rect(ctx, 140, 500, 1640, 120, themeColors.panel, themeColors.muted, 0);
      let x = 140;
      for (const [name, value, col] of parts) {
        const w = (value / 32) * 1640;
        api.rect(ctx, x, 500, w, 120, col, undefined, 0);
        if (name === 'KV pool') {
          api.rect(ctx, x + 8, 535, w / 2 - 16, 45, themeColors.panel, col, 0);
          drawCenteredText(ctx, api, '2 GB', x + w / 4, 568, 24, col);
        }
        x += w;
      }
      parts.forEach(([name, value, col], i) => {
        drawText(
          ctx,
          api,
          name + ' ' + value + ' GB',
          160 + (i % 3) * 590,
          750 + Math.floor(i / 3) * 105,
          29,
          col,
        );
      });
      if (resultComplete('pool', 1))
        drawCenteredText(
          ctx,
          api,
          '16 + 4 + 3 + 2 + 5 = 30 GB · live histories are inside the KV pool',
          960,
          965,
          30,
          themeColors.yellow,
        );
    } else {
      drawCard(ctx, api, 'MPS GPU operation', 150, 390, 620, 150, themeColors.yellow, 36);
      drawCard(ctx, api, 'CPU fallback operation', 1150, 650, 620, 150, themeColors.cyan, 36);
      if (B('fallback', 2)) {
        const q = ev('fallback', 2),
          x = api.lerp(190, 1210, q),
          y = api.lerp(580, 550, q);
        drawCard(ctx, api, 'same tensor task', x, y, 460, 85, themeColors.blue, 28);
      }
      if (resultComplete('dtype', 2))
        drawCenteredText(
          ctx,
          api,
          'float64 MPS allocation → rejected by the pinned allocator',
          960,
          925,
          33,
          themeColors.pink,
        );
    }
    drawFooter(
      ctx,
      api,
      'Check operation support, peak memory and synchronized latency on the target Mac',
    );
  });
}
export default {
  id: 'mps-boundary',
  draw: drawMpsBoundary,
  cues: [
    'ag-mps-boundary-devices',
    'ag-mps-boundary-weights',
    'ag-mps-boundary-pool',
    'ag-mps-boundary-fallback',
    'ag-mps-boundary-dtype',
  ],
};
