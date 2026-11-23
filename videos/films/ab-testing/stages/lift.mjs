import { report } from '../fixtures.mjs';
import { accumulatedOutcomes, lift, liftInterval } from '../model.mjs';
import { drawAxes, withFocus, writeEquation, writeText } from '../defaults.mjs';
export function drawLift(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    for (const [i, arm] of Object.values(report).entries())
      withFocus(ctx, api, i ? 'treatment-outcomes' : 'control-outcomes', () => {
        const q = currentBeat > 0 ? 1 : api.phase(progress, i ? 0.44 : 0.06, i ? 0.68 : 0.32);
        const observed = accumulatedOutcomes(arm, q),
          y = 395 + i * 200,
          color = i ? themeColors.pink : themeColors.blue;
        writeText(ctx, api, i ? 'REWRITE' : 'CONTROL', 190, y - 35, 29, color);
        const totalWidth = (720 * observed.n) / arm.n,
          successWidth = (720 * observed.resolved) / arm.n;
        if (totalWidth) api.rect(ctx, 190, y, totalWidth, 55, '#39465b', undefined, 0);
        if (successWidth) api.rect(ctx, 190, y, successWidth, 55, color, undefined, 0);
        writeText(
          ctx,
          api,
          `${observed.resolved.toLocaleString('en-US')} resolved / ${observed.n.toLocaleString('en-US')} incidents`,
          190,
          y + 100,
          28,
          themeColors.ink,
        );
        writeText(
          ctx,
          api,
          observed.rate === null
            ? 'Awaiting outcomes'
            : `${(observed.rate * 100).toFixed(1)}% resolved`,
          910,
          y - 35,
          30,
          color,
          'right',
        );
      });
    const plot = drawAxes(
      ctx,
      api,
      1080,
      375,
      620,
      390,
      [-0.02, 0.09],
      [-0.5, 0.5],
      '',
      '',
      [-0.02, 0, 0.02, 0.04, 0.06, 0.08],
      [],
    );
    const left = plot.point(liftInterval[0], 0),
      right = plot.point(liftInterval[1], 0),
      center = plot.point(lift, 0);
    api.line(
      ctx,
      plot.point(0, -0.42).x,
      plot.bounds.y,
      plot.point(0, -0.42).x,
      plot.bounds.y + plot.bounds.height,
      themeColors.muted,
      3,
    );
    if (currentBeat >= 2)
      api.components.fade(phaseForBeat(2, 0.42, 0.66), () =>
        withFocus(ctx, api, 'lift-interval', () =>
          api.path(ctx, [left, right], {
            color: themeColors.green,
            width: 8,
            clip: plot.bounds,
          }),
        ),
      );
    if (currentBeat > 0 || progress >= 0.78)
      api.circle(ctx, center.x, center.y, 12, themeColors.yellow);
    writeText(
      ctx,
      api,
      'Absolute resolution-rate lift',
      1390,
      340,
      27,
      themeColors.muted,
      'center',
    );
    if (currentBeat > 0 || progress >= 0.78)
      withFocus(ctx, api, 'absolute-lift', () =>
        writeEquation(
          ctx,
          api,
          String.raw`\Delta=42\%-38\%=+4.0\text{ pp}`,
          1335,
          850,
          43,
          themeColors.yellow,
          'center',
        ),
      );
    if (currentBeat >= 2)
      api.components.fade(phaseForBeat(2, 0.7, 0.92), () =>
        withFocus(ctx, api, 'lift-interval', () =>
          writeEquation(
            ctx,
            api,
            String.raw`95\%\text{ interval }[+1.0,+7.0]\text{ pp}`,
            1335,
            920,
            35,
            themeColors.cyan,
            'center',
          ),
        ),
      );
    if (currentBeat >= 1)
      withFocus(ctx, api, 'relative-lift', () =>
        writeEquation(
          ctx,
          api,
          String.raw`\text{relative lift}=\frac{0.42-0.38}{0.38}\approx10.5\%`,
          770,
          980,
          34,
          themeColors.cyan,
          'center',
        ),
      );
    if (currentBeat >= 2)
      withFocus(ctx, api, 'lift-standard-error', () =>
        writeEquation(
          ctx,
          api,
          String.raw`SE(\Delta)=\sqrt{\frac{.38\cdot.62}{2000}+\frac{.42\cdot.58}{2000}}\approx.01548`,
          960,
          270,
          34,
          themeColors.yellow,
          'center',
        ),
      );
  }
}
export default {
  id: 'lift',
  draw: drawLift,
  cues: [
    'lift-beat-1-focus-1',
    'lift-beat-1-focus-2',
    'lift-beat-1-focus-3',
    'lift-beat-2-focus-1',
    'lift-beat-3-focus-1',
    'lift-beat-3-focus-2',
  ],
};
