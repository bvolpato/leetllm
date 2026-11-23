import { sampleModel } from '../construction.mjs';
import { text, visualFocus } from '../defaults.mjs';
export function drawServingBreakEven(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('serving-break-even', state);
  {
    text(
      ctx,
      api,
      modelState.step === 2
        ? 'The curves meet near 165B processed serving tokens'
        : 'Hypothetical quality-matched plans · estimated lifetime work',
      960,
      285,
      25,
      modelState.step === 2 ? themeColors.yellow : themeColors.muted,
      'center',
    );
    const plot = teaching.axes({
      x: 250,
      y: 375,
      width: 1260,
      height: 490,
      xDomain: [0, 200],
      yDomain: [5, 9],
      xTicks: [0, 50, 100, 150, 165, 200],
      yTicks: [5, 6, 7, 8, 9],
      xLabel: 'processed serving tokens · billions',
      yLabel: 'estimated work · zettaFLOPs',
      fontSize: 22,
    });
    const largePoints = [0, 50, 100, 150, 200].map((q) => ({
      x: q,
      y: (modelState.large.train + 2 * modelState.large.parameters * q * 1e9) / 1e21,
    }));
    const smallPoints = [0, 50, 100, 150, 200].map((q) => ({
      x: q,
      y: (modelState.small.train + 2 * modelState.small.parameters * q * 1e9) / 1e21,
    }));
    visualFocus(ctx, api, 'serving-plan-curves', () =>
      teaching.curve({
        plot,
        points: largePoints,
        color: themeColors.blue,
        width: 5,
        progress: 1,
      }),
    );
    visualFocus(ctx, api, 'serving-plan-curves', () =>
      teaching.curve({
        plot,
        points: smallPoints,
        color: themeColors.green,
        width: 5,
        progress: 1,
      }),
    );
    const qBillions = modelState.q / 1e9;
    const largeAtQ = modelState.largeTotal / 1e21;
    const smallAtQ = modelState.smallTotal / 1e21;
    teaching.curve({
      plot,
      points: [
        {
          x: qBillions,
          y: 5,
        },
        {
          x: qBillions,
          y: 9,
        },
      ],
      color: themeColors.muted,
      width: 2,
    });
    visualFocus(ctx, api, 'serving-break-even-object-distribution-serving-break-even-53', () =>
      teaching.scatter({
        plot,
        points: [
          {
            x: qBillions,
            y: largeAtQ,
            color: themeColors.blue,
            radius: 11,
          },
          {
            x: qBillions,
            y: smallAtQ,
            color: themeColors.green,
            radius: 11,
          },
        ],
      }),
    );
    if (modelState.step === 2 && modelState.q >= modelState.breakEven) {
      const cross = plot.point(165, 8.19);
      visualFocus(ctx, api, 'serving-break-even-object-cross-x-cross-y-15-c-yellow-54', () =>
        api.circle(ctx, cross.x, cross.y, 15, themeColors.yellow),
      );
    }
    text(
      ctx,
      api,
      '7B/140B · 5.88 ZFLOPs   |   3B/400B · 7.20 ZFLOPs   |   saves 8B ops/token',
      960,
      965,
      21,
      themeColors.cyan,
      'center',
    );
    text(
      ctx,
      api,
      'current sample · ' +
        qBillions.toFixed(0) +
        'B tokens · ' +
        largeAtQ.toFixed(2) +
        ' / ' +
        smallAtQ.toFixed(2) +
        ' ZFLOPs',
      960,
      1020,
      25,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'serving-break-even',
  draw: drawServingBreakEven,
  cues: [
    'serving-break-even-beat-1-focus-1',
    'serving-break-even-beat-1-focus-2',
    'serving-break-even-beat-2-focus-1',
    'serving-break-even-beat-3-focus-1',
  ],
};
