export function text(ctx, api, v, x, y, n = 36, k = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, n, k, a);
}
export function equation(ctx, api, v, x, y, n = 48, k = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, n, k, a);
}
export function card(ctx, api, label, x, y, width = 270, k = api.C.cyan) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height: 100,
    fontSize: 36,
    padding: 14,
    fill: api.C.panel,
    stroke: k,
    textColor: k,
  });
}
export function extensionText(
  ctx,
  api,
  text,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, text, x, y, size, color, align);
}
export function extensionEquation(ctx, api, text, x, y, size = 44, color = api.C.ink) {
  return api.math(ctx, text, x, y, size, color, 'center');
}
export function arrow(ctx, api, x, y, xx, yy, color = api.C.cyan, width = 4) {
  return api.arrow(ctx, x, y, xx, yy, color, width);
}
export function rectangle(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 2, 10);
}
export function box(ctx, api, text, x, y, w, h = 90, color = api.C.blue, size = 30) {
  rectangle(ctx, api, x, y, w, h, color);
  extensionText(ctx, api, text, x + w / 2, y + h / 2 + size * 0.34, size, color);
}
export function footer(ctx, api, text) {
  return extensionText(ctx, api, text, 960, 1010, 28, api.C.muted);
}

// Only unvoiced storyboards use the fractional beat window.
export function cueMotion(state, id, beat, start, end) {
  if (state.cues) return state.cues[id]?.progress ?? 0;
  if (state.beat !== beat) return Number(state.beat > beat);
  return Math.min(1, Math.max(0, (state.beatP - start) / (end - start)));
}

export function cueDone(state, id, beat, end) {
  if (state.cues) return state.cues[id]?.phase === 'after';
  return state.beat > beat || (state.beat === beat && state.beatP >= end);
}
