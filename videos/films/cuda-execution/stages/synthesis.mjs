import { sampleModel } from '../model.mjs';
import { drawOriginalEquation, drawOriginalMark, drawOriginalText } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('synthesis', state);
  {
    drawOriginalText(
      ctx,
      api,
      'Same 1,000 FLOPs   /   40 GB/s bandwidth, 100 GFLOP/s compute',
      160,
      285,
      31,
      themeColors.muted,
    );
    const plot = teaching.axes({
      x: 240,
      y: 410,
      width: 990,
      height: 420,
      xDomain: [0, 4.5],
      yDomain: [0, 120],
      xTicks: [0, 1, 2, 3, 4],
      yTicks: [0, 40, 80, 120],
      xLabel: 'FLOP / byte',
      yLabel: 'upper bound · GFLOP/s',
      fontSize: 28,
    });
    teaching.curve({
      plot,
      points: Array.from(
        {
          length: 91,
        },
        (_, i) => ({
          x: i / 20,
          y: Math.min(100, (40 * i) / 20),
        }),
      ),
      color: themeColors.cyan,
      width: 5,
    });
    drawOriginalMark(ctx, api, 'roofline-point', () => {
      if (currentBeat === 0 && modelState.p === 0) return;
      if (currentBeat > 0) {
        const prior = currentBeat === 1 ? { x: 0.25, y: 10 } : { x: 1, y: 40 };
        teaching.scatter({ plot, points: [{ ...prior, color: themeColors.muted, radius: 8 }] });
      }
      return teaching.scatter({
        plot,
        points: [
          {
            x: modelState.intensity,
            y: modelState.bound,
            color: themeColors.yellow,
            radius: 13,
          },
        ],
      });
    });
    drawOriginalMark(ctx, api, 'byte-ledger', () => {
      drawOriginalText(ctx, api, '1,000 operations', 1390, 435, 34);
      drawOriginalText(
        ctx,
        api,
        '≈ ' + Math.round(modelState.bytes).toLocaleString('en') + ' bytes',
        1390,
        535,
        37,
        themeColors.blue,
      );
      if (currentBeat === 0 && modelState.p < 1) return;
      drawOriginalText(
        ctx,
        api,
        'I ≈ ' + modelState.intensity.toFixed(2),
        1390,
        640,
        40,
        themeColors.yellow,
      );
      drawOriginalText(
        ctx,
        api,
        'Bound ≈ ' + modelState.bound.toFixed(1),
        1390,
        745,
        40,
        themeColors.green,
      );
    });
    drawOriginalEquation(ctx, api, 'P\\leq\\min(100,40I)', 960, 970, 49, themeColors.muted);
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['build-intensity', 'reuse-bytes', 'reach-compute'],
};
