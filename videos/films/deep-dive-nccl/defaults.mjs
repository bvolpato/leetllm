export function originalText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function originalEquation(ctx, api, v, x, y, size = 43, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function originalCard(ctx, api, label, x, y, width = 350, color = api.C.blue, height = 95) {
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
export function originalTransfer(ctx, api, a, z, color, progress) {
  return api.teaching.transfer({
    source: {
      shape: a,
      opacity: 1,
    },
    target: {
      shape: z,
      opacity: 1,
    },
    progress,
    color,
    particle: {
      radius: 9,
      fill: color,
    },
    margin: 10,
  });
}
export function chapterText(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function chapterEquation(ctx, api, v, x, y, size = 42, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function chapterRectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.muted) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 4);
}
export function chapterCard(ctx, api, label, x, y, w = 330, h = 82, color = api.C.blue) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: 27,
    padding: 12,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
  });
}
export function chapterGrid(ctx, api, labels, x, y, w = 1350, h = 95, colors = []) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: 28,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: api.C.ink,
    highlights: labels.flatMap((row, r) =>
      row.map((_, column) => ({
        row: r,
        column,
        fill: api.C.panel,
        stroke: colors[column] ?? api.C.muted,
      })),
    ),
  });
}
export function chapterHeading(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 285, 35, api.C.yellow, 'center');
}
export function chapterNote(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 1035, 26, api.C.muted, 'center');
}
export function chapterPacket(ctx, api, value, x0, y0, x1, y1, q, color = api.C.yellow) {
  const x = x0 + (x1 - x0) * q,
    y = y0 + (y1 - y0) * q;
  chapterRectangle(ctx, api, x - 52, y - 29, 104, 58, api.C.panel, color);
  chapterText(ctx, api, String(value), x, y + 11, 27, color, 'center');
}
export function chapterLine(ctx, api, x0, y0, x1, y1, color = api.C.muted, width = 3) {
  return api.line(ctx, x0, y0, x1, y1, color, width);
}
