export function text(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width = 300,
  color = api.C.cyan,
  height = 95,
  opacity = 1,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    opacity,
  });
}
export function equation(ctx, api, v) {
  return api.math(ctx, v, 960, 980, 42, api.C.yellow, 'center');
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id);
}
export function cueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function rankingText(ctx, api, value, x, y, size = 28, color = api.C.ink, align = 'left') {
  const label = String(value)
    .replace(
      /\b(grades?|ranks?|counts?|gain|maximum|budget|display|relevant|position|slot|train|validation|test|authored|actual|samples|searches|scoring gate|cap|is|at|served|contributes|p95)(?=\d)/gi,
      '$1 ',
    )
    .replace(/(\d)(?=rows\b|steps\b|train\b|valid\b|test\b|samples\b|searches\b|ms\b)/g, '$1 ');
  api.text(ctx, label, x, y, size, color, align, label.includes('_') ? 'mono' : 'sans');
}
export function line(ctx, api, x, y, xx, yy, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, xx, yy, color, width);
}
export function box(ctx, api, value, x, y, w = 500, h = 76, color = api.C.blue, size = 28) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 0);
  rankingText(ctx, api, value, x + w / 2, y + h / 2 + 9, size, color, 'center');
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function arrow(ctx, api, x, y, xx, yy, color = api.C.cyan, progress = 1) {
  if (progress > 0)
    api.arrow(ctx, x, y, x + (xx - x) * progress, y + (yy - y) * progress, color, 3);
}
export function footer(ctx, api, value) {
  return rankingText(ctx, api, value, 960, 1020, 25, api.C.muted, 'center');
}
export function bar(ctx, api, x, y, w, h, value, total, color) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 0);
  if (value > 0) api.rect(ctx, x, y, (w * value) / total, h, color, undefined, 0);
}
export function tile(ctx, api, id, score, x, y, color = api.C.blue, width = 400) {
  return box(
    ctx,
    api,
    id + (score === null ? '' : ' · ' + score.toFixed(3)),
    x,
    y,
    width,
    74,
    color,
    29,
  );
}
export function miniSlate(ctx, api, rows, x, y, width = 400) {
  return rows.forEach((row, i) => {
    const color =
      row.grade !== undefined
        ? row.grade >= 3
          ? api.C.green
          : row.grade >= 2
            ? api.C.cyan
            : api.C.blue
        : ['P5', 'J2'].includes(row.id)
          ? api.C.green
          : ['P6', 'J5'].includes(row.id)
            ? api.C.cyan
            : api.C.blue;
    rankingText(ctx, api, i + 1, x - 30, y + i * 105 + 46, 25, api.C.muted, 'right');
    tile(ctx, api, row.id, row.score ?? null, x, y + i * 105, color, width);
  });
}
