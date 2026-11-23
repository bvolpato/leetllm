import { V } from '../fixtures.mjs';
import { limitsGeometry } from '../construction.mjs';
import { focusTarget, text } from '../defaults.mjs';
import { normalizeVector } from 'vizmatic';
export function drawLimits(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const current = limitsGeometry(currentBeat, progress),
      names = Object.keys(V),
      colors = [themeColors.yellow, themeColors.cyan, themeColors.blue, themeColors.green];
    const axes = teaching.axes({
      x: 130,
      y: 340,
      width: 840,
      height: 550,
      equalUnits: true,
      xDomain: [-1, 4.4],
      yDomain: [-1, 4.4],
      xTicks: [0, 1, 3, 4],
      yTicks: [0, 1, 3, 4],
      fontSize: 26,
    });
    const o = axes.point(0, 0);
    focusTarget(ctx, api, 'limits-simulation-29', () =>
      current.current.forEach((v, i) => {
        const tip = axes.point(...v),
          old = axes.point(...Object.values(V)[i]);
        api.arrow(ctx, o.x, o.y, tip.x, tip.y, colors[i], 3);
        api.circle(ctx, tip.x, tip.y, 9, colors[i]);
      }),
    );
    text(
      ctx,
      api,
      'Same endpoints · shared translation or centering',
      530,
      285,
      29,
      themeColors.ink,
      'center',
    );
    [1, 3].forEach((i) => {
      const at = axes.point(...current.current[i]);
      text(ctx, api, names[i], at.x + 80, at.y - 40, 27, colors[i], 'center');
    });
    api.circle(ctx, o.x, o.y, 7, themeColors.yellow);
    text(ctx, api, 'origin', o.x - 20, o.y + 40, 25, themeColors.yellow, 'right');
    const river = axes.point(...current.current[1]),
      money = axes.point(...current.current[3]);
    api.line(ctx, river.x, river.y, money.x, money.y, themeColors.pink, 4);
    text(
      ctx,
      api,
      'river–money distance ' + current.distance.toFixed(3),
      530,
      980,
      30,
      themeColors.pink,
      'center',
    );
    text(
      ctx,
      api,
      'Unit directions from the same origin',
      1440,
      300,
      31,
      themeColors.ink,
      'center',
    );
    const origin = {
        x: 1440,
        y: 610,
      },
      scale = 230;
    api.line(ctx, 1180, 610, 1700, 610, themeColors.muted, 2);
    api.line(ctx, 1440, 350, 1440, 870, themeColors.muted, 2);
    [1, 3].forEach((i) => {
      const v = normalizeVector(current.current[i]);
      api.arrow(
        ctx,
        origin.x,
        origin.y,
        origin.x + scale * v[0],
        origin.y - scale * v[1],
        colors[i],
        6,
      );
    });
    [1, 3].forEach((i) => {
      const v = normalizeVector(current.current[i]);
      const x = origin.x + scale * v[0],
        y = origin.y - scale * v[1];
      text(
        ctx,
        api,
        names[i],
        x + (v[0] >= 0 ? 85 : -85),
        y + (v[1] >= 0 ? -35 : 45),
        27,
        colors[i],
        'center',
      );
    });
    text(
      ctx,
      api,
      'cosine ' + current.cosine.toFixed(3),
      1440,
      980,
      42,
      themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'Add [3, 3] to every endpoint'
        : currentBeat === 1
          ? 'Subtract the same mean from every endpoint'
          : 'Distances stayed fixed; origin-based angles changed',
      960,
      1045,
      29,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'limits',
  draw: drawLimits,
  cues: ['limits-beat-1-focus-1', 'limits-beat-2-focus-1', 'limits-beat-3-focus-1'],
};
