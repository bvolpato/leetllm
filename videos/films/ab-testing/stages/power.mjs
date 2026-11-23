import { requiredN } from '../arithmetic.mjs';
import { abStarted } from '../construction.mjs';
import { lift, projectedInterval } from '../model.mjs';
import { drawAxes, withFocus, writeText } from '../defaults.mjs';
export function drawPower(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress2 = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress2, a, z);
  {
    const ns = [200, 500, 2000];
    const progress = phaseForBeat(0, 0.46, 0.72),
      n = Math.round(
        progress < 0.5
          ? api.lerp(200, 500, progress * 2)
          : api.lerp(500, 2000, (progress - 0.5) * 2),
      );
    const current = projectedInterval(n);
    const plot = drawAxes(
      ctx,
      api,
      260,
      365,
      890,
      430,
      [-0.08, 0.16],
      [0, 2200],
      'estimated lift',
      'incidents per arm',
      [-0.05, 0, 0.05, 0.1, 0.15],
      ns,
    );
    ns.forEach((sampleSize, i) => {
      const interval = projectedInterval(sampleSize),
        v = [interval.low, interval.high];
      const y = sampleSize,
        color = [themeColors.blue, themeColors.cyan, themeColors.green][i];
      const a = plot.point(v[0], y),
        z = plot.point(v[1], y);
      withFocus(ctx, api, 'sample-size-intervals', () =>
        api.components.fade(0.55, () => {
          api.path(ctx, [a, z], {
            color,
            width: 4,
            clip: plot.bounds,
          });
        }),
      );
    });
    const activeY = current.n,
      a = plot.point(current.low, activeY),
      z = plot.point(current.high, activeY);
    withFocus(ctx, api, 'sample-size-intervals', () =>
      api.path(ctx, [a, z], {
        color: themeColors.yellow,
        width: 10,
        clip: plot.bounds,
      }),
    );
    api.circle(ctx, plot.point(lift, activeY).x, a.y, 12, themeColors.yellow);
    withFocus(ctx, api, 'sample-size-value', () =>
      api.teaching.changeCue(
        {
          x: 1200,
          y: 370,
          width: 570,
          height: 85,
          from: 200,
          to: 2000,
          progress: (n - 200) / 1800,
          color: themeColors.yellow,
          restColor: themeColors.yellow,
          emphasis: progress > 0 && progress < 1 ? 1 : 0,
        },
        (cue) =>
          writeText(
            ctx,
            api,
            `${Math.round(cue.value).toLocaleString('en-US')} incidents / arm`,
            1480,
            425,
            32,
            cue.color,
            'center',
          ),
      ),
    );
    writeText(
      ctx,
      api,
      'Projected interval narrows as n grows',
      1480,
      510,
      28,
      themeColors.ink,
      'center',
    );
    writeText(
      ctx,
      api,
      'Fixed assumed rates: 38% and 42%',
      1480,
      575,
      27,
      themeColors.muted,
      'center',
    );
    if (currentBeat >= 1) {
      withFocus(ctx, api, 'planning-assumptions', () =>
        writeText(ctx, api, 'MDE +2 pp · power 80%', 1480, 740, 29, themeColors.yellow, 'center'),
      );
      if (currentBeat > 1 || abStarted(state, 'power-beat-2-focus-2', progress2 > 0.7))
        withFocus(ctx, api, 'planning-result', () =>
          writeText(
            ctx,
            api,
            `${Math.round(requiredN(0.38, 0.02)).toLocaleString('en-US')} incidents / arm`,
            1480,
            825,
            29,
            themeColors.ink,
            'center',
          ),
        );
    }
  }
}
export default {
  id: 'power',
  draw: drawPower,
  cues: [
    'power-beat-1-focus-1',
    'power-beat-1-focus-2',
    'power-beat-2-focus-1',
    'power-beat-2-focus-2',
    'power-beat-3-focus-1',
    'power-beat-3-focus-2',
  ],
};
