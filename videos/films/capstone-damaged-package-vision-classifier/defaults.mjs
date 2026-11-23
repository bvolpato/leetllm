import { parcelGeometry, visionClamp } from './arithmetic.mjs';
export function originalText(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function originalCard(ctx, api, v, x, y, w = 420, color = api.C.cyan, h = 100) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 28,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function originalPhoto(
  ctx,
  api,
  x,
  y,
  w,
  { dark = false, empty = false, torn = true } = {},
) {
  const h = w * 0.65;
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 12);
  if (!empty) {
    for (const shape of parcelGeometry(x, y, w, dark, torn)) {
      api.path(ctx, shape.points, shape);
    }
  }
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function visionText(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function visionCard(ctx, api, label, x, y, width = 400, height = 100, color = api.C.cyan) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 29,
    padding: 14,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function visionNote(ctx, api, value) {
  return visionText(ctx, api, value, 960, 978, 25, api.C.muted, 'center');
}
export function visionValue(ctx, api, label, number, x, y, shown = true, color = api.C.yellow) {
  visionText(ctx, api, label, x, y, 26, api.C.muted);
  visionText(ctx, api, shown ? number : 'pending', x, y + 56, 41, shown ? color : api.C.muted);
}
export function visionLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function visionArrow(ctx, api, a, z, color = api.C.cyan) {
  return api.arrow(ctx, a.x + a.width, a.y + a.height / 2, z.x, z.y + z.height / 2, color, 3);
}
export function visionPhoto(ctx, api, x, y, width, dark = false, empty = false) {
  const height = width * 0.65;
  api.rect(ctx, x, y, width, height, api.C.panel, api.C.muted, 10);
  if (!empty)
    for (const shape of parcelGeometry(x, y, width, dark)) api.path(ctx, shape.points, shape);
  return {
    x,
    y,
    width,
    height,
  };
}
export function visionMatrix(ctx, api, rows, x, y, cell = 64, colors) {
  rows.forEach((row, r) =>
    row.forEach((v, col) => {
      const fill = colors ? colors(v, r, col) : api.C.panel;
      api.rect(ctx, x + col * cell, y + r * cell, cell - 5, cell - 5, fill, api.C.muted, 3);
      visionText(
        ctx,
        api,
        v,
        x + col * cell + (cell - 5) / 2,
        y + r * cell + cell * 0.59,
        Math.min(31, cell * 0.45),
        fill === api.C.muted ? api.C.bg : api.C.ink,
        'center',
      );
    }),
  );
  return {
    x,
    y,
    width: rows[0].length * cell - 5,
    height: rows.length * cell - 5,
  };
}
export function visionProgress(ctx, api, fraction, x, y, width, color = api.C.cyan) {
  api.rect(ctx, x, y, width, 18, api.C.panel, api.C.muted, 2);
  if (fraction > 0) api.rect(ctx, x, y, width * visionClamp(fraction), 18, color, undefined, 2);
}
export function visionTable(ctx, api, rows, x = 200, y = 360, width = 1500, rowHeight = 92) {
  return rows.forEach((row, r) =>
    row.forEach((v, c) =>
      visionText(
        ctx,
        api,
        v,
        x + (c * width) / row.length,
        y + r * rowHeight,
        r ? 29 : 27,
        r ? api.C.ink : api.C.muted,
      ),
    ),
  );
}
export function visionMetrics(ctx, api, report, show, y = 830) {
  visionValue(
    ctx,
    api,
    'TP / FP / FN / TN',
    Object.values(report.counts).join(' / '),
    200,
    y,
    show,
    api.C.cyan,
  );
  visionValue(
    ctx,
    api,
    'Precision',
    report.precision === null ? 'undefined' : report.precision.toFixed(3),
    900,
    y,
    show,
    api.C.yellow,
  );
  visionValue(
    ctx,
    api,
    'Recall',
    report.recall === null ? 'undefined' : report.recall.toFixed(3),
    1390,
    y,
    show,
    api.C.pink,
  );
}
