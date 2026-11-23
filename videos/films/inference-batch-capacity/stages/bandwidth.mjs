import { bandwidthPoint } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawBandwidth(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  let directed = state;
  if (state.cues) {
    const b = state.beat;
    let u = null,
      k = 1;
    if (b > 0) {
      u = api.focus.progress(b === 1 ? 'batch-eight' : 'larger-batch-crossing', 0);
      if (b === 1) u = Math.min(1, u / 0.8);
    }
    if (u !== null)
      directed = {
        ...state,
        beatP: 0.15 + 0.6 * k * u,
      };
  }
  const modelState = sampleModel('bandwidth', directed),
    currentBeat = modelState.step;
  {
    api.focus.target('bandwidth-authored-full-read-model-effective-500-gi-b-s-4-096-po', () =>
      drawOriginalText(
        ctx,
        api,
        'Read once per step   ·   12 GiB of weights   +   0.5 GiB per conversation   ·   500 GiB/s',
        140,
        260,
        28,
        themeColors.muted,
      ),
    );
    const timePlot = teaching.axes({
      x: 190,
      y: 410,
      width: 650,
      height: 370,
      xDomain: [0, 32],
      yDomain: [0, 60],
      xTicks: [0, 8, 16, 24, 32],
      yTicks: [0, 20, 40, 60],
      xLabel: 'active batch',
      yLabel: 'iteration time (ms)',
    });
    const ratePlot = teaching.axes({
      x: 1090,
      y: 410,
      width: 650,
      height: 370,
      xDomain: [0, 32],
      yDomain: [0, 600],
      xTicks: [0, 8, 16, 24, 32],
      yTicks: [0, 200, 400, 600],
      xLabel: 'active batch',
      yLabel: 'aggregate tokens/s',
    });
    const points = Array.from(
      {
        length: 32,
      },
      (_, i) => bandwidthPoint(i + 1),
    );
    const target = timePlot.point(0, 40);
    const targetEnd = timePlot.point(32, 40);
    api.focus.target('bandwidth-limit', () => {
      api.line(ctx, target.x, target.y, targetEnd.x, target.y, themeColors.yellow, 3);
      drawOriginalText(
        ctx,
        api,
        '40 ms limit',
        target.x + 12,
        target.y - 18,
        28,
        themeColors.yellow,
      );
    });
    api.focus.target('iteration-time-curve', () =>
      teaching.curve({
        plot: timePlot,
        points: points.map((point) => ({
          x: point.batch,
          y: point.ms,
        })),
        color: themeColors.pink,
        width: 4,
      }),
    );
    api.focus.target('output-rate-curve', () =>
      teaching.curve({
        plot: ratePlot,
        points: points.map((point) => ({
          x: point.batch,
          y: point.tps,
        })),
        color: themeColors.cyan,
        width: 4,
      }),
    );
    api.focus.target('iteration-time-curve', () =>
      teaching.scatter({
        plot: timePlot,
        points: [
          {
            x: modelState.batch,
            y: modelState.ms,
            radius: 10,
            color: themeColors.yellow,
          },
        ],
      }),
    );
    api.focus.target('output-rate-curve', () =>
      teaching.scatter({
        plot: ratePlot,
        points: [
          {
            x: modelState.batch,
            y: modelState.tps,
            radius: 10,
            color: themeColors.yellow,
          },
        ],
      }),
    );
    api.focus.target('bandwidth-readout', () =>
      drawOriginalText(
        ctx,
        api,
        `B = ${modelState.batch} · ${modelState.ms.toFixed(1)} ms / iteration · ${modelState.tps.toFixed(1)} tokens/s`,
        960,
        925,
        32,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('bandwidth-readout-2', () =>
      drawOriginalText(
        ctx,
        api,
        modelState.ms <= 40 ? 'Within the 40 ms limit' : `${modelState.ms - 40} ms over the limit`,
        960,
        985,
        28,
        modelState.ms <= 40 ? themeColors.green : themeColors.pink,
        'center',
      ),
    );
  }
}
export default {
  id: 'bandwidth',
  draw: drawBandwidth,
  cues: [
    'read-bytes',
    'byte-time',
    'batch-eight',
    'longer-iteration',
    'larger-batch-crossing',
    'latency-target',
    'cache-traffic',
  ],
};
