import { DROP_FIXTURE } from '../fixtures.mjs';
import { TRACKS, projectionState } from '../construction.mjs';
import { projectedDrop } from '../model.mjs';
import { legacyCard, legacyText, visualFocus } from '../defaults.mjs';
export function drawProjection(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const snap = TRACKS['projection']?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const projected = projectionState({
      beat,
      beatP: progress,
    });
    const graph = teaching.axes({
      x: 280,
      y: 390,
      width: 800,
      height: 440,
      equalUnits: true,
      xDomain: [-1, 3],
      yDomain: [-1, 3],
      xTicks: [0, 1, 2],
      yTicks: [0, 1, 2],
      xLabel: 'retained x',
      yLabel: 'retained y',
      fontSize: 24,
    });
    const origin = graph.point(0, 0);
    {
      api.line(ctx, origin.x, origin.y, origin.x + 280, origin.y - 240, themeColors.muted, 2);
      legacyText(
        ctx,
        api,
        'discarded z',
        origin.x + 255,
        origin.y - 330,
        24,
        themeColors.pink,
        'center',
      );
      for (const z of [2, 4, 6, 8]) {
        const x = origin.x + 35 * z,
          y = origin.y - 30 * z;
        api.line(ctx, x - 6, y - 6, x + 6, y + 6, themeColors.muted, 2);
        legacyText(ctx, api, String(z), x + 55, y + 30, 24, themeColors.muted, 'center');
      }
    }
    visualFocus(ctx, api, 'projection-simulation-13', () =>
      projectedDrop
        .filter((row) => projected.visible.includes(row.id))
        .forEach((row) => {
          const target = graph.point(row.xy[0], row.xy[1]);
          if (row.id === 'D') {
            const moving = {
              x: target.x + 35 * projected.remainingZ,
              y: target.y - 30 * projected.remainingZ,
            };
            if (projected.drop < 1) {
              api.circle(ctx, moving.x, moving.y, 12, themeColors.pink);
              legacyText(
                ctx,
                api,
                'D',
                moving.x - 28,
                moving.y - 25,
                25,
                themeColors.pink,
                'right',
              );
            }
            const ring = Array.from(
              {
                length: 49,
              },
              (_, point) => {
                const angle = (point * Math.PI * 2) / 48;
                return {
                  x: target.x + 22 * Math.cos(angle),
                  y: target.y + 22 * Math.sin(angle),
                };
              },
            );
            components.fade(projected.drop === 1 ? 1 : 0, () => {
              api.path(ctx, ring, {
                color: themeColors.pink,
                width: 4,
              });
              legacyText(
                ctx,
                api,
                'D lands on A',
                target.x + 36,
                target.y + 75,
                24,
                themeColors.pink,
              );
            });
          } else
            api.circle(
              ctx,
              target.x,
              target.y,
              11,
              row.id === 'A'
                ? themeColors.green
                : row.id === 'B'
                  ? themeColors.cyan
                  : themeColors.yellow,
            );
          if (row.id === 'A')
            legacyText(ctx, api, row.id, target.x - 28, target.y + 50, 24, themeColors.ink);
          else if (row.id !== 'D')
            legacyText(ctx, api, row.id, target.x + 35, target.y - 16, 24, themeColors.ink);
        }),
    );
    legacyCard(
      ctx,
      api,
      'projection',
      'Original distance from A',
      1240,
      410,
      420,
      72,
      themeColors.blue,
      beat > 0 ? 1 : phaseForBeat(0.08, 0.72),
      26,
    );
    visualFocus(ctx, api, 'projection-simulation-21', () =>
      DROP_FIXTURE.forEach((row, index) =>
        legacyCard(
          ctx,
          api,
          'projection',
          `${row.id} · ${Math.hypot(...row.point).toFixed(0)} units`,
          1240,
          500 + index * 76,
          420,
          64,
          index === 3 ? themeColors.pink : themeColors.cyan,
          snap.visible.includes(row.id) ? (beat > 0 ? 1 : phaseForBeat(index * 0.07, 0.78)) : 0.3,
          25,
        ),
      ),
    );
    if (beat > 0) {
      teaching.changeCue(
        {
          x: 1235,
          y: 825,
          width: 470,
          height: 70,
          from: 8,
          to: 0,
          progress: projected.drop,
          color: themeColors.pink,
        },
        (cue) =>
          legacyText(
            ctx,
            api,
            `D’s remaining z: ${cue.value.toFixed(1)}`,
            1470,
            870,
            28,
            cue.color,
            'center',
          ),
      );
      legacyText(
        ctx,
        api,
        `Nearest to A: ${projected.nearestToA}`,
        1450,
        950,
        30,
        projected.nearestToA === 'D' ? themeColors.pink : themeColors.cyan,
        'center',
      );
    }
  }
}
export default {
  id: 'projection',
  draw: drawProjection,
  cues: [
    'projection-beat-1-focus-1',
    'all-four',
    'projection-beat-2-focus-1',
    'drop-z',
    'drop-collision',
    'projection-beat-3-focus-1',
  ],
};
