import { nominalRoofline } from '../arithmetic.mjs';
import { detailProgress } from '../construction.mjs';
import {
  drawAxis,
  drawDetailRectangle,
  drawDetailText,
  drawEarnedNumber,
  drawFooter,
  formatValue,
} from '../defaults.mjs';
export function drawRoofline(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'roofline', beat);
  const body = () => {
    if (beat < 2) {
      const plot = api.teaching.axes({
        x: 300,
        y: 405,
        width: 1260,
        height: 450,
        xDomain: [0, 3],
        yDomain: [0, 3.1],
        xTicks: [0, 1, 2, 3],
        yTicks: [0, 1, 2, 3],
        xLabel: 'log₁₀ arithmetic intensity · FLOPs / byte',
        yLabel: 'log₁₀ TFLOP/s',
        fontSize: 27,
      });
      const names = beat === 0 ? ['A100'] : ['A100', 'H100'];
      for (const [i, name] of names.entries()) {
        const f = nominalRoofline(name),
          color = i ? themeColors.cyan : themeColors.blue,
          points = Array.from(
            {
              length: 121,
            },
            (_, j) => {
              const x = j / 40;
              return {
                x,
                y: Math.log10(Math.min(f.dense, f.bandwidth * 10 ** x) / 1e12),
              };
            },
          );
        api.teaching.curve({
          plot,
          points,
          color,
          width: 4,
        });
        const at = plot.point(0, Math.log10(f.bandwidth / 1e12));
        api.teaching.scatter({
          plot,
          points: [
            {
              x: 0,
              y: Math.log10(f.bandwidth / 1e12),
              color,
              radius: 10,
            },
          ],
        });
        drawDetailText(
          ctx,
          api,
          name +
            ' dense ridge: ' +
            f.ridge.toFixed(1) +
            ' FLOPs/B · I=1: ' +
            (f.intensityOneShare * 100).toFixed(2) +
            '% peak',
          960,
          285 + i * 55,
          30,
          color,
          'center',
        );
      }
    } else {
      const f = nominalRoofline('H100'),
        left = 350,
        width = 1200,
        max = 20;
      drawDetailText(
        ctx,
        api,
        'H100 nominal 3.35 TB/s · one weight read per output step',
        960,
        300,
        33,
        themeColors.ink,
        'center',
      );
      for (const [i, bytes, ms, color] of [
        [0, 54, f.bf16Milliseconds, themeColors.blue],
        [1, 13.921875, f.compactMilliseconds, themeColors.cyan],
      ]) {
        const y = 460 + i * 230;
        drawDetailText(
          ctx,
          api,
          formatValue(ctx, api, bytes) + ' GB weights',
          left,
          y - 40,
          35,
          color,
        );
        drawDetailRectangle(ctx, api, left, y, (width * ms) / max, 70, color);
        drawEarnedNumber(
          ctx,
          api,
          ms.toFixed(3) + ' ms · ' + (1000 / ms).toFixed(1) + ' tokens/s',
          1330,
          y + 135,
          progress === 1,
          color,
          34,
        );
      }
      drawAxis(ctx, api, left, 865, width, max, 'weight-only read floor · milliseconds');
    }
    drawFooter(
      ctx,
      api,
      'Ceilings calculated from nominal dense compute and memory bandwidth',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'roofline'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'roofline',
  draw: drawRoofline,
  cues: ['roofline-build-0', 'roofline-build-1', 'roofline-build-2'],
};
