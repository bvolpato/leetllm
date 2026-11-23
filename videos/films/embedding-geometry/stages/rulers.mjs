import { METRICS, PASSAGES, QUERY } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import { equation, plane, text, vectorLine } from '../defaults.mjs';
function drawComplete(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  return false;
}
export function drawRulers(ctx, scene, state, api) {
  if (drawComplete(ctx, scene, state, api)) return;
  const { C: themeColors, components } = api;
  const beat = state.beat ?? 0;
  const progress2 = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress2, from, to);
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
      id: `${'rulers'}-${String(label).slice(0, 15)}-${x}-${y}`,
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
  const snapshot = TRACKS['rulers'].sample({
    beat,
    beatP: progress2,
  }).snapshot;
  {
    const graph = plane(ctx, api, {
      domain: [-1, 5],
      yDomain: [-1, 3],
    });
    api.focus.target('ruler-query', () => vectorLine(ctx, api, graph, QUERY, themeColors.cyan));
    api.focus.target('ruler-passage-a', () =>
      vectorLine(ctx, api, graph, PASSAGES[0].vector, themeColors.green),
    );
    api.focus.target('ruler-passage-b', () =>
      vectorLine(ctx, api, graph, PASSAGES[1].vector, themeColors.pink),
    );
    METRICS.forEach((row, index) => {
      const color = index === 0 ? themeColors.green : themeColors.pink;
      if (snapshot.ruler === 'cosine') {
        const angle = Math.acos(row.cosine) * phaseForBeat(0.04, 0.55);
        const radius = 0.55 + index * 0.3;
        api.focus.target('angle-arc-' + index, () =>
          api.path(
            ctx,
            Array.from(
              {
                length: 33,
              },
              (_, step) =>
                graph.point(
                  radius * Math.cos((angle * step) / 32),
                  radius * Math.sin((angle * step) / 32),
                ),
            ),
            {
              color,
              width: 3,
            },
          ),
        );
      } else {
        const progress = beat > 1 ? 1 : phaseForBeat(0.04, 0.55);
        api.focus.target('distance-gap-' + index, () =>
          api.path(
            ctx,
            [
              graph.point(...QUERY),
              graph.point(
                api.lerp(QUERY[0], row.vector[0], progress),
                api.lerp(QUERY[1], row.vector[1], progress),
              ),
            ],
            {
              color,
              width: 3,
            },
          ),
        );
      }
    });
    if (beat === 2) {
      PASSAGES.forEach((r, i) => {
        const z = graph.point(...r.vector),
          foot = graph.point(r.vector[0], 0);
        api.path(ctx, [z, foot], {
          color: (i ? themeColors.pink : themeColors.green) + '88',
          width: 2,
        });
        api.path(ctx, [graph.point(0, 0), foot], {
          color: themeColors.yellow,
          width: 3,
        });
      });
      text(ctx, api, 'q·A = 1×1 + 0×0.2 = 1', 1460, 800, 27, themeColors.green, 'center');
      text(ctx, api, 'q·B = 1×4 + 0×2 = 4', 1460, 855, 27, themeColors.pink, 'center');
    }
    text(ctx, api, snapshot.label, 960, 300, 34, themeColors.ink, 'center');
    const rows = METRICS.map((row) => ({
      name: `Passage ${row.id}`,
      value:
        snapshot.ruler === 'dot'
          ? row.dot
          : snapshot.ruler === 'cosine'
            ? row.cosine
            : row.distance,
      color: row.id === 'A' ? themeColors.green : themeColors.pink,
    }));
    rows.forEach((row, index) => {
      const y = 440 + index * 150;
      card(row.name, 1210, y, 310, 72, row.color, 1, 27);
      const metric = METRICS[index];
      const label =
        snapshot.ruler === 'comparison'
          ? `cos ${metric.cosine.toFixed(3)} · dot ${metric.dot} · L2 ${metric.distance.toFixed(3)}`
          : `${snapshot.ruler} · ${row.value.toFixed(3)}`;
      api.focus.target('ruler-score-' + index, () =>
        card(
          label,
          1210,
          y + 76,
          snapshot.ruler === 'comparison' ? 610 : 430,
          62,
          row.color,
          1,
          24,
        ),
      );
    });
    api.focus.target('similarity-rule', () =>
      equation(
        ctx,
        api,
        snapshot.ruler === 'cosine'
          ? String.raw`\cos(\theta)=\frac{q\cdot d}{\|q\|\|d\|}`
          : snapshot.ruler === 'dot'
            ? String.raw`q\cdot d=\sum_i q_i d_i`
            : String.raw`d_2(q,d)=\sqrt{\sum_i(q_i-d_i)^2}`,
        1450,
        930,
        33,
        themeColors.yellow,
      ),
    );
  }
}
export default {
  id: 'rulers',
  draw: drawRulers,
  cues: ['rulers-angle-arc-0-b1-1', 'rulers-distance-gap-0-b2-1', 'rulers-ruler-passage-b-b3-1'],
};
