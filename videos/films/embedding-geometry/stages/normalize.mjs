import { norm, normalized } from '../arithmetic.mjs';
import { PASSAGES, QUERY, UNIT_METRICS } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import { normalizationFrame } from '../model.mjs';
import { equation, plane, text, vectorLine } from '../defaults.mjs';
function drawComplete(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  return false;
}
export function drawNormalize(ctx, scene, state, api) {
  if (drawComplete(ctx, scene, state, api)) return;
  const { C: themeColors, components, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const card = (
    label,
    x,
    y,
    width,
    height = 82,
    color = themeColors.cyan,
    opacity = 1,
    fontSize = 27,
  ) =>
    components.card({
      id: `${'normalize'}-${String(label).slice(0, 15)}-${x}-${y}`,
      label,
      x,
      y,
      width,
      height,
      fill: themeColors.panel,
      stroke: color,
      textColor: color,
      radius: 14,
      padding: 10,
      fontSize,
      opacity,
    });
  const snapshot = TRACKS['normalize'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const active = PASSAGES.find((row) => row.id === snapshot.active);
    const rows = normalizationFrame(beat, progress);
    const graph = plane(
      ctx,
      api,
      beat === 0
        ? {
            domain: [-1.3, 4.5],
            yDomain: [-1.3, 2.5],
          }
        : {
            domain: [-1.3, 1.7],
            yDomain: [-1.3, 1.7],
          },
    );
    api.focus.target('normalized-query', () =>
      vectorLine(ctx, api, graph, normalized(QUERY), themeColors.cyan, 1, 5),
    );
    rows.forEach((row) =>
      api.focus.target('normalized-passage-' + row.id.toLowerCase(), () =>
        vectorLine(
          ctx,
          api,
          graph,
          row.current,
          row.id === 'A' ? themeColors.green : themeColors.pink,
          1,
          6,
        ),
      ),
    );
    const circle = Array.from(
      {
        length: 121,
      },
      (_, index) => {
        const angle = (index * Math.PI * 2) / 120;
        return {
          x: Math.cos(angle),
          y: Math.sin(angle),
        };
      },
    );
    teaching.curve({
      plot: graph,
      points: circle,
      color: themeColors.muted,
      width: 2,
    });
    text(
      ctx,
      api,
      'Current norms: A ' +
        norm(rows[0].current).toFixed(3) +
        ' · B ' +
        norm(rows[1].current).toFixed(3),
      700,
      280,
      29,
      themeColors.ink,
      'center',
    );
    if (beat > 0) {
      const grow = beat > 1 ? 1 : phaseForBeat(0.05, 0.8),
        q = normalized(QUERY);
      UNIT_METRICS.forEach((row, i) => {
        const d = row.vector,
          delta = [d[0] - q[0], d[1] - q[1]],
          normal = [delta[1] * grow, -delta[0] * grow],
          points = [
            q,
            d,
            [d[0] + normal[0], d[1] + normal[1]],
            [q[0] + normal[0], q[1] + normal[1]],
            q,
          ].map((v) => graph.point(...v));
        api.focus.target('unit-gap-area-' + i, () =>
          api.path(ctx, points, {
            color: i ? themeColors.pink : themeColors.green,
            width: 3,
          }),
        );
      });
      text(
        ctx,
        api,
        'Gap-square areas equal the squared distances',
        700,
        1020,
        27,
        themeColors.yellow,
        'center',
      );
    }
    if (beat === 0) {
      const measure = UNIT_METRICS.find((row) => row.id === active.id);
      api.focus.target('normalized-dot-score', () =>
        card(
          `Unit reference score · ${measure.score.toFixed(3)}`,
          1220,
          470,
          430,
          82,
          themeColors.yellow,
          1,
          28,
        ),
      );
      api.focus.target('normalized-distance-score', () =>
        card(
          `Unit reference L2² · ${measure.squaredDistance.toFixed(3)}`,
          1220,
          605,
          430,
          82,
          themeColors.green,
          1,
          27,
        ),
      );
    } else
      api.focus.target('normalized-dot-score', () =>
        UNIT_METRICS.forEach((row, i) => {
          const y = 410 + i * 160,
            color = row.id === 'A' ? themeColors.green : themeColors.pink;
          api.focus.target('normalized-reference-' + row.id.toLowerCase(), () => {
            components.panel({
              x: 1210,
              y,
              width: 600,
              height: 125,
              fill: themeColors.panel,
              stroke: color,
            });
            text(ctx, api, `${row.id} · unit-vector reference`, 1235, y + 38, 27, color);
            text(ctx, api, `dot = cos ${row.score.toFixed(3)}`, 1235, y + 88, 28, color);
            text(ctx, api, `L2² ${row.squaredDistance.toFixed(3)}`, 1570, y + 88, 28, color);
          });
        }),
      );
    if (beat === 0)
      api.focus.target('unit-metric-equivalence', () =>
        equation(
          ctx,
          api,
          String.raw`\|\hat q\|=\|\hat d\|=1\;\Longrightarrow\;\hat q\cdot\hat d=\cos(\theta)`,
          1450,
          940,
          31,
          themeColors.ink,
        ),
      );
    else {
      api.focus.target('unit-metric-equivalence', () =>
        equation(
          ctx,
          api,
          String.raw`\|\hat q-\hat d\|_2^2=2-2(\hat q\cdot\hat d)`,
          1460,
          815,
          36,
          themeColors.yellow,
        ),
      );
      equation(
        ctx,
        api,
        String.raw`\|\hat q\|=\|\hat d\|=1\;\Longrightarrow\;\hat q\cdot\hat d=\cos(\theta)`,
        1450,
        940,
        27,
        themeColors.ink,
      );
    }
  }
}
export default {
  id: 'normalize',
  draw: drawNormalize,
  cues: [
    'normalize-normalized-passage-a-b1-1',
    'normalize-unit-metric-equivalence-b2-1',
    'normalize-reference-a',
    'normalize-reference-b',
    'normalize-normalized-dot-score-b3-1',
  ],
};
