import { sphereMidpoints } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
export function drawSlerp(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.05, 0.93);
  const sphere = sphereMidpoints();
  {
    const plot = teaching.axes({
      x: 210,
      y: 360,
      width: 940,
      height: 540,
      equalUnits: true,
      xDomain: [-0.2, 1.2],
      yDomain: [-0.2, 1.2],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 0.5, 1],
      xLabel: 'weight coordinate 1',
      yLabel: 'weight coordinate 2',
    });
    const u = {
        x: 1,
        y: 0,
      },
      v = {
        x: 0.5,
        y: Math.sqrt(3) / 2,
      };
    const linear = {
        x: sphere.linear[0],
        y: sphere.linear[1],
      },
      spherical = {
        x: sphere.spherical[0],
        y: sphere.spherical[1],
      };
    const chordReveal = currentBeat === 0 ? api.focus.progress('slerp-b1-1', 0) : 1;
    const arcReveal =
      currentBeat === 1
        ? state.cues?.['slerp-b2-1']
          ? api.focus.progress('slerp-b2-1', 0)
          : phaseForBeat(1)
        : currentBeat > 1
          ? 1
          : 0;
    const linearMidpointReveal = currentBeat === 0 ? api.focus.progress('linear-radius', 0) : 1;
    const sphericalMidpointReveal =
      currentBeat === 1
        ? state.cues?.['slerp-b2-2']
          ? api.focus.progress('slerp-b2-2', 0)
          : phaseForBeat(1)
        : currentBeat > 1
          ? 1
          : 0;
    api.focus.target('linear-chord', () =>
      teaching.curve({
        plot,
        points: [u, linear, v],
        color: themeColors.pink,
        width: 4,
        progress: chordReveal,
      }),
    );
    api.focus.target('spherical-arc', () =>
      teaching.curve({
        plot,
        points: Array.from(
          {
            length: 61,
          },
          (_, i) => ({
            x: Math.cos(((Math.PI / 3) * i) / 60),
            y: Math.sin(((Math.PI / 3) * i) / 60),
          }),
        ),
        color: themeColors.cyan,
        width: 4,
        progress: arcReveal,
      }),
    );
    teaching.scatter({
      plot,
      points: [
        {
          ...u,
          color: themeColors.blue,
          radius: 10,
        },
        {
          ...v,
          color: themeColors.green,
          radius: 10,
        },
      ],
    });
    api.focus.target('linear-midpoint', () =>
      components.fade(linearMidpointReveal, () => {
        teaching.scatter({
          plot,
          points: [
            {
              ...linear,
              color: themeColors.pink,
              radius: 12,
            },
          ],
        });
        text(
          ctx,
          api,
          `Fixed linear midpoint · norm ${sphere.linearNorm.toFixed(2)}`,
          1490,
          495,
          29,
          themeColors.pink,
          'center',
        );
      }),
    );
    api.focus.target('spherical-midpoint', () =>
      components.fade(sphericalMidpointReveal, () => {
        teaching.scatter({
          plot,
          points: [
            {
              ...spherical,
              color: themeColors.cyan,
              radius: 12,
            },
          ],
        });
        text(
          ctx,
          api,
          `Fixed spherical midpoint · norm ${sphere.sphericalNorm.toFixed(2)}`,
          1490,
          635,
          29,
          themeColors.cyan,
          'center',
        );
      }),
    );
    text(
      ctx,
      api,
      'Endpoint angle 60° · both reference midpoints use t = 0.5',
      960,
      260,
      29,
      themeColors.muted,
      'center',
    );
    if (currentBeat === 2) {
      for (const [i, norm] of [sphere.linearNorm, sphere.sphericalNorm].entries()) {
        const y = 540 + 140 * i;
        api.line(ctx, 1205, y, 1775, y, themeColors.muted, 2);
        api.line(ctx, 1205, y, 1205 + 570 * norm, y, i ? themeColors.cyan : themeColors.pink, 8);
      }
    }
  }
}
export default {
  id: 'slerp',
  draw: drawSlerp,
  cues: ['slerp-b1-1', 'linear-radius', 'slerp-b2-1', 'slerp-b2-2', 'slerp-b3-1', 'slerp-b3-2'],
};
