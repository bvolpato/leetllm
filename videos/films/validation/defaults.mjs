export function detailText(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function line(ctx, api, x1, y1, x2, y2, col = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
export function tile(ctx, api, v, x, y, w = 180, h = 70, col = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, col, 4);
  detailText(ctx, api, v, x + w / 2, y + h / 2 + 10, 28, col, 'center');
}
export function heading(ctx, api, t) {
  return detailText(ctx, api, t, 960, 255, 29, api.C.muted, 'center');
}
export function optionalFocusTarget(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function phraseProgress(state, api, id, beat, start, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : cue.progress;
  if (state.beat !== beat) return (state.beat ?? 0) > beat ? 1 : 0;
  return api.phase(state.beatP ?? 0, start, end);
}
export function text(ctx, api, v, x, y, z = 34, c = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, c, a);
}
export function equation(ctx, api, v, x, y, z = 48, c = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, c, a);
}
export function card(ctx, api, label, x, y, w = 300, c = api.C.blue, opacity = 1) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: 100,
    fill: api.C.panel,
    stroke: c,
    textColor: c,
    fontSize: 32,
    padding: 12,
    opacity,
  });
}
