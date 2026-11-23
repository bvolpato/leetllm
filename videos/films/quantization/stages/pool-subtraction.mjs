import { cachePool } from '../arithmetic.mjs';
import { detailProgress } from '../construction.mjs';
import {
  drawDetailRectangle,
  drawDetailText,
  drawEarnedNumber,
  drawFooter,
  formatValue,
} from '../defaults.mjs';
export function drawPoolSubtraction(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'pool-subtraction', beat);
  const body = () => {
    const weights = beat === 0 ? 54 + (13.92 - 54) * progress : 13.92,
      left = 250,
      scale = 1450 / 80,
      pool = 80 - 8 - weights;
    drawDetailText(
      ctx,
      api,
      '80 GB device   ·   8 GB reserved',
      960,
      290,
      35,
      themeColors.ink,
      'center',
    );
    const pieces = [
      ['reserve', 8, themeColors.yellow],
      ['weights', weights, themeColors.blue],
      ['cache pool', pool, themeColors.pink],
    ];
    let x = left;
    pieces.forEach(([label, value, color]) => {
      drawDetailRectangle(ctx, api, x, 425, value * scale, 95, color);
      drawDetailText(ctx, api, label, x + (value * scale) / 2, 590, 29, color, 'center');
      drawDetailText(
        ctx,
        api,
        formatValue(ctx, api, value) + ' GB',
        x + (value * scale) / 2,
        660,
        31,
        color,
        'center',
      );
      x += value * scale;
    });
    if (beat === 0) {
      drawDetailText(
        ctx,
        api,
        '18 GB → 58.08 GB left after subtraction',
        960,
        820,
        42,
        themeColors.pink,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        '58.08 / 18 = ' + (58.08 / 18).toFixed(4) + '× pool capacity',
        960,
        920,
        34,
        themeColors.ink,
        'center',
      );
    } else if (beat === 1) {
      const a = cachePool(54),
        b = cachePool(13.92);
      drawDetailText(
        ctx, api, '16 layers × 4 KV heads × 256 values × 5,120 positions × 2 (K and V) × 2 bytes',
        960, 370, 30, themeColors.ink, 'center',
      );
      drawDetailText(
        ctx,
        api,
        'per user: 335,544,320 attention bytes',
        960,
        760,
        36,
        themeColors.ink,
        'center',
      );
      drawEarnedNumber(
        ctx,
        api,
        a.users + ' → ' + b.users + ' memory-only users',
        960,
        845,
        progress === 1,
        themeColors.green,
        44,
      );
      drawDetailText(
        ctx,
        api,
        'with 150,994,944 recurrent bytes: 36 → 119',
        960,
        935,
        32,
        themeColors.yellow,
        'center',
      );
    } else {
      const f = cachePool(13.92),
        bytes = f.attention * 173 + 13.92e9;
      drawDetailText(
        ctx,
        api,
        '173 full caches + 13.92 GB weights',
        960,
        780,
        40,
        themeColors.pink,
        'center',
      );
      drawEarnedNumber(
        ctx,
        api,
        ((bytes / 3.35e12) * 1000).toFixed(3) + ' ms ideal read floor',
        960,
        890,
        progress === 1,
        themeColors.yellow,
        47,
      );
    }
    drawFooter(
      ctx,
      api,
      'Same cache bytes per user at the same context length',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'pool-subtraction'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'pool-subtraction',
  draw: drawPoolSubtraction,
  cues: ['pool-subtraction-build-0', 'pool-subtraction-build-1', 'pool-subtraction-build-2'],
};
