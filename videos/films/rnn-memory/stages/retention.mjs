import { retentionFrame } from '../construction.mjs';
import { footer, math, text } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawRetention(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = components.fade;
  {
    const current = retentionFrame(currentBeat, progress);
    text(
      ctx,
      api,
      'Earlier error clue · normalized direct cell-path contribution',
      750,
      285,
      28,
      themeColors.muted,
      'center',
    );
    const q = teaching.axes({
      x: 250,
      y: 385,
      width: 1000,
      height: 360,
      xDomain: [0, 30],
      yDomain: [0, 1.06],
      xTicks: [0, 10, 20, 30],
      yTicks: [0, 0.5, 1],
      xLabel: 'transitions',
      yLabel: 'direct-path factor',
      fontSize: 34,
    });
    for (const [f, k] of [
      [0.98, themeColors.green],
      [0.5, themeColors.pink],
    ])
      teaching.curve({
        plot: q,
        points: sampleFunction((x) => f ** x, 0, 30, 160),
        color: k,
        width: 5,
        progress: current.curveProgress,
      });
    const n = current.n;
    for (const [f, k] of [
      [0.98, themeColors.green],
      [0.5, themeColors.pink],
    ]) {
      const at = q.point(n, f ** n);
      api.focus.target(k === themeColors.green ? 'retained-path' : 'fading-path', () =>
        api.circle(ctx, at.x, at.y, 9, k),
      );
    }
    teaching.changeCue(
      {
        x: 1390,
        y: 295,
        width: 385,
        height: 68,
        from: currentBeat === 0 ? 0 : 10,
        to: currentBeat === 0 ? 10 : 30,
        progress: current.moveProgress,
        emphasis: current.moving ? 0.8 : 0,
        color: themeColors.yellow,
        restColor: themeColors.ink,
      },
      (cue) => text(ctx, api, `T = ${n} transitions`, 1582, 341, 30, cue.color, 'center'),
    );
    text(ctx, api, 'keep 0.98', 1430, 440, 38, themeColors.green);
    api.focus.target('protective-retention', () =>
      math(
        ctx,
        api,
        `0.98^{${n}}\\approx${current.factors[0].toFixed(3)}`,
        1430,
        497,
        33,
        themeColors.green,
      ),
    );
    text(ctx, api, 'keep 0.50', 1430, 600, 38, themeColors.pink);
    const shortFactor =
      current.factors[1] < 0.001
        ? current.factors[1].toExponential(1).replace(/e([+-]?\d+)/, String.raw`\times10^{$1}`)
        : current.factors[1].toFixed(3);
    api.focus.target('halving-retention', () =>
      math(ctx, api, `0.50^{${n}}\\approx${shortFactor}`, 1430, 657, 33, themeColors.pink),
    );
    api.focus.target('forget-gate-product', () =>
      math(ctx, api, String.raw`\prod_{j=1}^{T}f_j`, 1460, 800, 56, themeColors.yellow),
    );
    footer(ctx, api, 'Full gradients include other paths');
  }
}
export default {
  id: 'retention',
  draw: drawRetention,
  cues: [
    'forget-gate-product-b1-1',
    'protective-retention-b2-1',
    'halving-retention-b2-2',
    'forget-gate-product-b3-1',
  ],
};
