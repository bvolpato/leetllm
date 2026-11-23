import { clamp01, groupedReduction } from '../arithmetic.mjs';
import { detailProgress, extraProgress } from '../construction.mjs';
import {
  drawAxis,
  drawDetailEquation,
  drawDetailLine,
  drawDetailRectangle,
  drawDetailText,
  drawEarnedNumber,
  drawFooter,
  drawRow,
  formatValue,
} from '../defaults.mjs';
export function drawGroupSum(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'group-sum', beat);
  const body = () => {
    const first =
      beat === 1
        ? extraProgress(state, 'group-first-scale', clamp01(progress * 2))
        : beat > 1
          ? 1
          : 0;
    const second =
      beat === 1
        ? extraProgress(state, 'group-second-scale', clamp01(progress * 2 - 1))
        : beat > 1
          ? 1
          : 0;
    const accumulationProgress = first < 1 ? first / 2 : 0.5 + second / 2,
      f = groupedReduction(accumulationProgress);
    drawDetailText(
      ctx,
      api,
      'One reduction · two reconstruction recipes',
      960,
      280,
      35,
      themeColors.ink,
      'center',
    );
    for (let g = 0; g < 2; g++) {
      const x = 400 + g * 850,
        color = g ? themeColors.pink : themeColors.blue,
        partial =
          beat === 0
            ? extraProgress(state, g ? 'group-second-partial' : 'group-first-partial', progress)
            : 1;
      drawDetailText(
        ctx,
        api,
        'group ' + g + ' · S = ' + f.scales[g],
        x + 100,
        365,
        33,
        color,
        'center',
      );
      drawRow(ctx, api, f.codes.slice(g * 2, g * 2 + 2), x, 460, color, 200);
      drawRow(ctx, api, f.inputs.slice(g * 2, g * 2 + 2), x, 550, themeColors.muted, 200);
      drawDetailLine(ctx, api, x - 75, 590, x + 275, 590, color);
      drawEarnedNumber(
        ctx,
        api,
        'partial = ' + f.partials[g],
        x + 100,
        665,
        partial === 1,
        color,
        38,
      );
    }
    if (beat > 0) {
      const left = 310,
        width = 1260;
      drawAxis(ctx, api, left, 860, width, 6, 'output units · scale each group before adding');
      let start = 0;
      for (const [i, term] of f.accumulation.terms.entries()) {
        const amount = term.applied[0];
        drawDetailRectangle(
          ctx,
          api,
          left + (start / 6) * width,
          770,
          (amount / 6) * width,
          45,
          i ? themeColors.pink : themeColors.blue,
        );
        if (amount > 0.8)
          drawDetailText(
            ctx,
            api,
            formatValue(ctx, api, amount),
            left + ((start + amount / 2) / 6) * width,
            802,
            28,
            themeColors.bg,
            'center',
          );
        start += amount;
      }
      drawEarnedNumber(
        ctx,
        api,
        '0.25 × 6 + 2 × 2 = 5.5',
        960,
        725,
        beat > 1 || progress === 1,
        themeColors.green,
        42,
      );
    } else
      drawDetailEquation(
        ctx,
        api,
        '(2\\cdot4)+(-1\\cdot2)\\qquad(3\\cdot-1)+(1\\cdot5)',
        960,
        820,
        46,
        themeColors.ink,
      );
    if (beat === 2)
      drawDetailText(
        ctx,
        api,
        'One outer scale: 0.25 × (6 + 2) = 2  ✕',
        960,
        325,
        28,
        themeColors.yellow,
        'center',
      );
    drawFooter(ctx, api, 'Group ownership survives packing, accumulation and scaling');
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'group-sum'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'group-sum',
  draw: drawGroupSum,
  cues: [
    'group-sum-build-0',
    'group-first-partial',
    'group-second-partial',
    'group-sum-build-1',
    'group-first-scale',
    'group-second-scale',
    'group-sum-build-2',
  ],
};
