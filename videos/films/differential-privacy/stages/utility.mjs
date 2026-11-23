import { utilityDiagnostics, utilityNoiseScale } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawUtility(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    text(
      ctx,
      api,
      'One perpendicular offset on the clipped mean',
      960,
      300,
      37,
      themeColors.ink,
      'center',
    );
    const noiseScale = state.cues?.['grow-noise']
      ? 0.1 + 0.4 * api.focus.progress('grow-noise', 0)
      : utilityNoiseScale(state);
    const diagnostic = utilityDiagnostics(noiseScale);
    const vectorPlot = teaching.axes({
      x: 180,
      y: 380,
      width: 700,
      height: 400,
      equalUnits: true,
      xDomain: [-0.2, 2],
      yDomain: [-0.2, 2],
      xTicks: [0, 0.5, 1, 1.5],
      yTicks: [0, 0.5, 1, 1.5],
      xLabel: 'update coordinate 1',
      yLabel: 'update coordinate 2',
    });
    const origin = vectorPlot.point(0, 0),
      signal = vectorPlot.point(...diagnostic.signal),
      noisy = vectorPlot.point(...diagnostic.noisy);
    api.focus.target('mean-gradient', () =>
      api.arrow(ctx, origin.x, origin.y, signal.x, signal.y, themeColors.cyan, 6),
    );
    api.focus.target('noise-direction', () =>
      api.arrow(ctx, signal.x, signal.y, noisy.x, noisy.y, themeColors.pink, 5),
    );
    api.circle(ctx, noisy.x, noisy.y, 10, themeColors.yellow);
    text(ctx, api, 'Clipped mean', 760, 350, 25, themeColors.cyan, 'center');
    text(
      ctx,
      api,
      'offset',
      noisy.x + 20,
      noisy.y - 15,
      24,
      themeColors.pink,
    );
    const utilityPlot = teaching.axes({
      x: 1000,
      y: 390,
      width: 720,
      height: 280,
      xDomain: [0, 1.5],
      yDomain: [0, 1.05],
      xTicks: [0, 0.5, 1, 1.5],
      yTicks: [0, 0.5, 1],
      xLabel: 'offset length',
      yLabel: 'cosine with mean',
    });
    const curve = Array.from(
      {
        length: 61,
      },
      (_, i) => {
        const sigma = (1.5 * i) / 60;
        return {
          x: sigma,
          y: utilityDiagnostics(sigma).utility,
        };
      },
    );
    api.focus.target('cosine-curve', () =>
      teaching.curve({
        plot: utilityPlot,
        points: curve,
        color: themeColors.yellow,
        width: 5,
        progress: 1,
      }),
    );
    api.focus.target('cosine-curve', () =>
      teaching.scatter({
        plot: utilityPlot,
        points: [
          {
            x: noiseScale,
            y: diagnostic.utility,
            color: themeColors.pink,
            radius: 12,
          },
        ],
      }),
    );
    api.focus.target('clipping-rate', () =>
      card(
        ctx,
        api,
        `Clipped records: ${diagnostic.clippedCount} / 4  ·  ${(diagnostic.clippingRate * 100).toFixed(0)}%`,
        1060,
        760,
        620,
        themeColors.cyan,
        78,
      ),
    );
    text(
      ctx,
      api,
      `Offset length ${noiseScale.toFixed(2)}  ·  cosine ${diagnostic.utility.toFixed(2)}`,
      1360,
      885,
      27,
      themeColors.pink,
      'center',
    );
    text(
      ctx,
      api,
      'Measure copilot quality on held-out tasks.',
      960,
      940,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'utility',
  draw: drawUtility,
  cues: ['clipped-mean', 'grow-noise', 'clipping-diagnostic', 'proxy-limit'],
};
