import { math, text } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawGradients(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.12, 0.86),
    F = components.fade;
  {
    const q = teaching.axes({
      x: 240,
      y: 385,
      width: 880,
      height: 360,
      xDomain: [0, 12],
      yDomain: [0, 1.05],
      xTicks: [0, 4, 8, 12],
      yTicks: [0, 0.5, 1],
      xLabel: 'backward links',
      yLabel: 'surviving signal',
      fontSize: 34,
    });
    const n = 12 * phaseForBeat(0);
    teaching.curve({
      plot: q,
      points: sampleFunction((x) => 0.6 ** x, 0, n || 0.001, 80),
      color: themeColors.pink,
      width: 6,
    });
    const at = q.point(n, 0.6 ** n);
    api.focus.target('fading-gradient', () => api.circle(ctx, at.x, at.y, 10, themeColors.pink));
    api.focus.target('gradient-chain-rule', () =>
      math(ctx, api, String.raw`g_k=0.6^k g_0`, 1320, 430, 48, themeColors.pink),
    );
    F(phaseForBeat(1), () => text(ctx, api, '12 links: ≈ 0.22%', 1310, 550, 36, themeColors.pink));
    api.focus.reveal('clipped-recurrent-gradient-b3-1', () => {
      const scale = api.lerp(1, 0.35, phaseForBeat(2));
      api.focus.target('clipped-recurrent-gradient', () =>
        api.arrow(ctx, 1390, 790, 1390 + 220 * scale, 790 - 150 * scale, themeColors.yellow, 5),
      );
      text(ctx, api, 'clipping keeps direction', 1450, 880, 34, themeColors.yellow, 'center');
    });
  }
}
export default {
  id: 'gradients',
  draw: drawGradients,
  cues: ['gradient-chain-rule-b1-1', 'fading-gradient-b2-1', 'clipped-recurrent-gradient-b3-1'],
};
