import { awqError, awqReconstruct } from '../arithmetic.mjs';
import { detailProgress } from '../construction.mjs';
import { drawDetailRectangle, drawDetailText, drawFooter, drawRow } from '../defaults.mjs';
export function drawAwqSearch(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'awq-search', beat);
  const body = () => {
    const factors = beat === 0 ? [1, 2, 4, 8] : [1, 2, 4, 8, 32],
      left = 290,
      width = 1290;
    const rows = factors.map((factor) => ({
      factor,
      weights: awqReconstruct(factor),
      error: awqError(factor),
    }));
    drawDetailText(
      ctx,
      api,
      'Same calibration outputs · declared scale candidates',
      960,
      290,
      35,
      themeColors.ink,
      'center',
    );
    if (beat < 2) {
      const plot = api.teaching.axes({
        x: left,
        y: 395,
        width,
        height: 390,
        xDomain: [0, 4],
        yDomain: [-4, -0.2],
        xTicks: factors.map((_, i) => i),
        yTicks: [-4, -3, -2, -1],
        xLabel: 'candidate index · factors shown below',
        yLabel: 'log₁₀ calibration MSE',
        fontSize: 27,
      });
      const visible =
        beat === 0
          ? Math.min(rows.length, 3 + Math.floor(progress + 1e-9))
          : Math.min(rows.length, 4 + Math.floor(progress + 1e-9));
      const points = rows.slice(0, visible).map((r, i) => ({
        x: i,
        y: Math.log10(r.error),
      }));
      api.teaching.curve({
        plot,
        points,
        color: themeColors.cyan,
        width: 4,
      });
      points.forEach((v, i) => {
        api.teaching.scatter({
          plot,
          points: [
            {
              ...v,
              radius: 9,
              color: i === 4 ? themeColors.pink : themeColors.cyan,
            },
          ],
        });
        drawDetailText(
          ctx,
          api,
          rows[i].error.toFixed(6),
          left + (i * width) / 4,
          970,
          28,
          i === 4 ? themeColors.pink : themeColors.cyan,
          'center',
        );
      });
      drawRow(
        ctx,
        api,
        factors.map((f) => 's=' + f),
        left,
        915,
        themeColors.muted,
        width / 4,
        30,
      );
      if (beat === 1)
        drawDetailText(
          ctx,
          api,
          progress === 1
            ? 'Factor 8 held-out MSE  0.000816     ·     Factor 32 increases the calibration error'
            : 'Factor 8 held-out MSE  0.000816',
          960,
          325,
          30,
          themeColors.yellow,
          'center',
        );
    } else {
      const columns = 20;
      for (let i = 0; i < columns; i++) {
        const x = 220 + i * 78,
          active = i <= Math.floor(progress * 19);
        drawDetailRectangle(
          ctx,
          api,
          x,
          460,
          58,
          active ? 200 : 28,
          active ? themeColors.cyan : themeColors.panel,
        );
        drawDetailText(
          ctx,
          api,
          (i * 0.05).toFixed(2),
          x + 29,
          735,
          24,
          themeColors.muted,
          'center',
        );
      }
      drawDetailText(
        ctx,
        api,
        '20 exponents · 0.00 through 0.95',
        960,
        360,
        35,
        themeColors.cyan,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        'restore parameters between candidates',
        960,
        840,
        38,
        themeColors.yellow,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        'normalize / linear weights + bias / scaling wrapper',
        960,
        935,
        30,
        themeColors.ink,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Select by complete output error · reserve held-out inputs before selection',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'awq-search'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'awq-search',
  draw: drawAwqSearch,
  cues: ['awq-search-build-0', 'awq-search-build-1', 'awq-search-build-2'],
};
