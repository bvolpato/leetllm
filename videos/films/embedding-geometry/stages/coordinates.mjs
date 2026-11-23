import { PASSAGES, QUERY } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import { plane, text, vectorLine } from '../defaults.mjs';
function drawComplete(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  return false;
}
export function drawCoordinates(ctx, scene, state, api) {
  if (drawComplete(ctx, scene, state, api)) return;
  const { C: themeColors, components } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
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
      id: `${'coordinates'}-${String(label).slice(0, 15)}-${x}-${y}`,
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
  const reached = (id, fallback) =>
    state.cues?.[id] ? state.cues[id].phase !== 'before' : fallback;
  const snapshot = TRACKS['coordinates'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const graph = plane(ctx, api);
    const elapsed = progress * 15.334;
    const visible =
      beat > 0
        ? ['query', 'A', 'B']
        : [
            ...(elapsed >= 0.3625 ? ['query'] : []),
            ...(elapsed >= 3.95 ? ['A'] : []),
            ...(elapsed >= 7.65 ? ['B'] : []),
          ];
    if (visible.includes('query'))
      api.focus.target('query-vector', () => vectorLine(ctx, api, graph, QUERY, themeColors.cyan));
    if (reached('coordinates-passage-a-vector-b1-1', visible.includes('A')))
      api.focus.target('passage-a-vector', () =>
        vectorLine(ctx, api, graph, PASSAGES[0].vector, themeColors.green),
      );
    if (reached('coordinates-passage-b-vector-b1-2', visible.includes('B')))
      api.focus.target('passage-b-vector', () =>
        vectorLine(ctx, api, graph, PASSAGES[1].vector, themeColors.pink),
      );
    const labels = [
      ['Query · ripe apple', 1280, 420, themeColors.cyan],
      ['A · fresh apple', 1280, 545, themeColors.green],
      ['B · garden fruit basket', 1280, 670, themeColors.pink],
    ];
    labels.forEach(([label, x, y, color], index) => {
      if (visible.includes(['query', 'A', 'B'][index])) card(label, x, y, 420, 76, color, 1, 25);
    });
    [
      ['query', QUERY, 'q [1,0]', themeColors.cyan],
      ['A', PASSAGES[0].vector, 'A [1,0.2]', themeColors.green],
      ['B', PASSAGES[1].vector, 'B [4,2]', themeColors.pink],
    ].forEach(([id, v, label, col]) => {
      if (!visible.includes(id)) return;
      const z = graph.point(...v);
      text(
        ctx,
        api,
        label,
        z.x + (id === 'query' ? -75 : 30),
        z.y + (id === 'query' ? 65 : -35),
        25,
        col,
        id === 'query' ? 'center' : 'left',
      );
    });
    text(
      ctx,
      api,
      'Hand-built coordinates for a geometric experiment',
      960,
      310,
      25,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'coordinates',
  draw: drawCoordinates,
  cues: [
    'coordinates-passage-a-vector-b1-1',
    'coordinates-passage-b-vector-b1-2',
    'coordinates-passage-a-vector-b2-1',
    'coordinates-passage-b-vector-b3-1',
  ],
};
