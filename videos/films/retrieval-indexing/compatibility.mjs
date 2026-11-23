import { TRACKS } from './model.mjs';
export function drawUnknownRetrievalScene(ctx, scene, state, api) {
  const visualFocus = (id, paint) => (api.focus ? api.focus.target(id, paint) : paint());
  const { C, components, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const reveal = (from = 0.08, to = 0.84) => api.phase(progress, from, to);
  const T = (value, x, y, size = 31, color = C.ink, align = 'left') =>
    api.text(ctx, String(value), x, y, size, color, align);
  const M = (value, x, y, size = 42, color = C.ink, align = 'center') =>
    api.math(ctx, value, x, y, size, color, align);
  const card = (label, x, y, width, height = 82, color = C.cyan, opacity = 1, fontSize = 29) =>
    components.card({
      id: `${scene.id}-${String(label).slice(0, 16)}-${x}-${y}`,
      label,
      x,
      y,
      width,
      height,
      fill: C.panel,
      stroke: color,
      textColor: color,
      radius: 14,
      padding: 12,
      fontSize,
      opacity,
    });
  const snapshot = TRACKS[scene.id].sample({
    beat,
    beatP: progress,
  }).snapshot;
  const docColor = (id) => (snapshot.relevant?.includes(id) ? C.green : C.pink);
  if (['query', 'bm25', 'ranking', 'top-k', 'evaluation'].includes(scene.id))
    T('Same query · make + soup', 150, 225, 25, C.cyan);
  throw new Error(`Unknown retrieval-indexing scene ${scene.id}`);
}
