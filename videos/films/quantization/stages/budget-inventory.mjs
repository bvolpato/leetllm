import { detailProgress, extraProgress } from '../construction.mjs';
import {
  drawAxis,
  drawDetailLine,
  drawDetailRectangle,
  drawDetailText,
  drawFooter,
  fadeDetail,
  formatValue,
} from '../defaults.mjs';
export function drawBudgetInventory(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'budget-inventory', beat);
  const body = () => {
    drawDetailText(
      ctx,
      api,
      '27 billion quantizable weights · declared inventory',
      960,
      285,
      34,
      themeColors.ink,
      'center',
    );
    const left = 390,
      width = 1240,
      scale = width / 60,
      values = [54, 27, 13.5, 10.125],
      colors = [themeColors.blue, themeColors.cyan, themeColors.green, themeColors.pink];
    values.forEach((value, i) => {
      const y = 365 + i * 135,
        growth = beat === 0 ? extraProgress(state, 'budget-bits-' + [16, 8, 4, 3][i], progress) : 1;
      drawDetailText(
        ctx,
        api,
        ['BF16', 'INT8', 'INT4', 'INT3'][i],
        left - 35,
        y + 35,
        33,
        colors[i],
        'right',
      );
      drawDetailRectangle(ctx, api, left, y, value * scale * growth, 48, colors[i]);
      if (growth === 1)
        drawDetailText(
          ctx,
          api,
          formatValue(ctx, api, value) + ' GB',
          left + value * scale + 24,
          y + 35,
          32,
          colors[i],
        );
    });
    drawAxis(ctx, api, left, 895, width, 60, 'decimal GB · 1 GB = 10⁹ bytes');
    if (beat >= 1) {
      const metadata = 0.421875,
        amount = beat === 1 ? progress : 1;
      drawDetailRectangle(
        ctx,
        api,
        left + 13.5 * scale,
        635,
        metadata * scale * amount,
        48,
        themeColors.yellow,
      );
      fadeDetail(ctx, api, amount, () => {
        drawDetailLine(ctx, api, left + 13.5 * scale, 697, 1070, 697, themeColors.yellow);
        drawDetailText(ctx, api, '+0.421875 GB of scales', 1090, 708, 29, themeColors.yellow);
        drawDetailText(ctx, api, '13.921875 GB = 12.966 GiB', 1090, 758, 29, themeColors.ink);
      });
    }
    if (beat === 2) {
      const x = left + 24 * scale;
      drawDetailLine(ctx, api, x, 335, x, 850, themeColors.yellow, 4);
      drawDetailText(ctx, api, '24 GB capacity', x + 20, 330, 29, themeColors.yellow);
      drawDetailText(
        ctx,
        api,
        'other loaded modules + runtime: measure',
        1320,
        840,
        26,
        themeColors.pink,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'One FP16 scale per 128 weights · zero-points, preserved tensors and runtime allocations remain separate',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'budget-inventory'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'budget-inventory',
  draw: drawBudgetInventory,
  cues: [
    'budget-inventory-build-0',
    'budget-bits-16',
    'budget-bits-8',
    'budget-bits-4',
    'budget-bits-3',
    'budget-inventory-build-1',
    'budget-inventory-build-2',
  ],
};
