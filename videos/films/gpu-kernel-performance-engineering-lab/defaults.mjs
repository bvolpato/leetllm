export function text(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function equation(ctx, api, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 95, z = 30) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function chapterText(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'center') {
  return api.text(
    ctx,
    String(s),
    x,
    y,
    size,
    color,
    align,
    String(s).includes('_') ? 'mono' : 'sans',
  );
}
export function rectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.line, r = 10) {
  return api.rect(ctx, x, y, w, h, fill, stroke, r);
}
export function line(ctx, api, x, y, u, v, color = api.C.line, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function dot(ctx, api, x, y, color = api.C.cyan, r = 6) {
  return api.circle(ctx, x, y, r, color);
}
export function footer(ctx, api, s) {
  return chapterText(ctx, api, s, 960, 1008, 27, api.C.muted);
}
export function title(ctx, api, s) {
  return chapterText(ctx, api, s, 150, 286, 35, api.C.ink, 'left');
}
export function resultCard(ctx, api, text, x, y, color = api.C.cyan, size = 34) {
  rectangle(ctx, api, x - 290, y - 48, 580, 88, api.C.panel, color);
  chapterText(ctx, api, text, x, y + 8, size, color);
}
export function matrix(ctx, api, labels, x, y, w = 420, h = 350, selected = null) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fill: api.C.panel,
    stroke: api.C.line,
    textColor: api.C.ink,
    fontSize: 30,
    highlights: selected
      ? [
          {
            row: selected[0],
            column: selected[1],
            fill: '#f4d47730',
            stroke: api.C.yellow,
          },
        ]
      : [],
  });
}
export function threadDots(ctx, api, x, y, w, h, count, color = api.C.green) {
  for (let i = 0; i < 256; i++)
    dot(
      ctx,
      api,
      x + (((i % 32) + 0.5) * w) / 32,
      y + ((Math.floor(i / 32) + 0.5) * h) / 8,
      i < count ? color : api.C.line,
      3.5,
    );
}
