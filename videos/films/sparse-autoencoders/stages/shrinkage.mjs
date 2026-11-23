import { retainedDrawEquation, retainedDrawText } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawShrinkage(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.1, 0.9);
  {
    const l = api.lerp(0, 2.4, (currentBeat + phaseForBeat(currentBeat)) / 2),
      z = Math.max(0, 1 - l / 2),
      q = teaching.axes({
        x: 250,
        y: 410,
        width: 900,
        height: 350,
        xDomain: [0, 1.3],
        yDomain: [0, 3],
        xTicks: [0, 0.5, 1],
        yTicks: [0, 1, 2, 3],
        xLabel: 'nonnegative coefficient',
        yLabel: 'objective',
        fontSize: 34,
      });
    api.focus.target('coefficient-curve', () =>
      teaching.curve({
        plot: q,
        points: sampleFunction((v) => (1 - v) ** 2 + l * v, 0, 1.3, 100),
        color: themeColors.cyan,
        width: 5,
      }),
    );
    const at = q.point(z, (1 - z) ** 2 + l * z);
    api.focus.target('coefficient-optimum', () =>
      api.circle(ctx, at.x, at.y, 12, themeColors.yellow),
    );
    api.focus.target('shrinkage-rule', () =>
      retainedDrawEquation(
        ctx,
        api,
        String.raw`z^*=\max(0,1-\lambda/2)`,
        1480,
        430,
        48,
        themeColors.yellow,
        'center',
      ),
    );
    retainedDrawText(ctx, api, `λ = ${l.toFixed(2)}`, 1480, 605, 40, themeColors.ink, 'center');
    retainedDrawText(
      ctx,
      api,
      `optimum = ${z.toFixed(3)}`,
      1480,
      780,
      38,
      themeColors.green,
      'center',
    );
  }
}
export default {
  id: 'shrinkage',
  draw: drawShrinkage,
  cues: ['shrinkage-b1-1', 'shrinkage-b1-2', 'shrinkage-b2-1'],
};
