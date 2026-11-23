import { cueProgress } from '../construction.mjs';
import { repeatedRates } from '../model.mjs';
import { detailText, focusTarget, line } from '../defaults.mjs';
export function drawSamplingError(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors, teaching: teaching } = api,
    E = (beat, id) => cueProgress(state, id, beat);
  {
    const n = currentBeat < 2 ? 50 : E(2, 'sample-size') < 0.5 ? 50 : 200,
      rates = repeatedRates(n),
      q = E(0, 'repeat-evaluations'),
      visible = currentBeat === 0 ? Math.floor(60 * q) : 60,
      se = Math.sqrt((0.8 * 0.2) / n),
      plot = teaching.axes({
        x: 300,
        y: 430,
        width: 1260,
        height: 320,
        xDomain: [0.4, 1],
        yDomain: [0, 1],
        xTicks: [0.4, 0.6, 0.8, 1],
        yTicks: [],
        xLabel: 'measured pass rate',
        yLabel: 'independent repeated evaluations',
        fontSize: 26,
      });
    rates.slice(0, visible).forEach((v, i) => {
      const at = plot.point(v, 0.15 + (i % 9) * 0.085);
      api.circle(ctx, at.x, at.y, 8, themeColors.cyan);
    });
    const lo = plot.point(0.8 - 2 * se, 0),
      hi = plot.point(0.8 + 2 * se, 0);
    line(ctx, api, lo.x, 790, hi.x, 790, themeColors.yellow, 7);
    focusTarget(ctx, api, 'rate-uncertainty', () => {
      detailText(
        ctx,
        api,
        `Same true p=.80 · ${n} independent cases per evaluation`,
        960,
        320,
        33,
        themeColors.ink,
      );
      detailText(
        ctx,
        api,
        currentBeat === 0
          ? 'Watch the rates fluctuate under one unchanged model'
          : `SE≈${se.toFixed(4)} · rough 2SE≈${(2 * se).toFixed(4)}`,
        960,
        920,
        35,
        themeColors.yellow,
      );
      detailText(
        ctx,
        api,
        'Normal approximation and independence are stated model assumptions',
        960,
        1010,
        29,
        themeColors.muted,
      );
    });
  }
  return;
}
export default {
  id: 'sampling-error',
  draw: drawSamplingError,
  cues: ['repeat-evaluations', 'sample-size'],
};
