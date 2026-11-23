export function text(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 48, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, width = 350, color = api.C.blue, height = 95) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function chapterText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function chapterEquation(ctx, api, v, x, y, size = 40, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function chapterLine(ctx, api, x, y, z, w, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function chapterArrow(ctx, api, x, y, z, w, color = api.C.cyan) {
  return api.arrow(ctx, x, y, z, w, color, 3);
}
export function chapterTag(ctx, api, value, x, y, w = 240, color = api.C.blue, h = 70) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 2);
  chapterText(ctx, api, value, x + w / 2, y + h / 2 + 10, 29, color, 'center');
}
export function chapterTitle(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 285, 34, api.C.yellow, 'center');
}
export function chapterFooter(ctx, api, v, color = api.C.muted) {
  return chapterText(ctx, api, v, 960, 1020, 27, color, 'center');
}
export function chapterGrid(ctx, api, labels, x, y, w, h, color = api.C.blue, fontSize = 27) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
  });
}
export function chapterVector(ctx, api, values, x, y, w = 1000, color = api.C.blue) {
  return chapterGrid(ctx, api, [values], x, y, w, 85, color, 29);
}
export function chapterValueBar(ctx, api, label, value, max, x, y, w = 1000, color = api.C.blue) {
  chapterText(ctx, api, label, x, y - 18, 26, color);
  chapterLine(ctx, api, x, y + 25, x + w, y + 25);
  api.rect(ctx, x, y, (w * value) / max, 50, color);
  chapterText(ctx, api, value.toFixed(2), x + w + 80, y + 38, 29, color, 'center');
}

export function spokenProgress(state, api, id, beat, start = 0, end = 1) {
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  const fallback = state.cues
    ? 0
    : Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
  return api.focus.progress(id, fallback);
}
