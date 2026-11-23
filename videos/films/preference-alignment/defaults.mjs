export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function equation(ctx, api, v, x, y, z = 46, col = api.C.ink, a = 'center') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function card(ctx, api, label, x, y, width = 520, color = api.C.cyan, opacity = 1) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height: 96,
    fontSize: 31,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    opacity,
  });
}
export function answerCard(ctx, api, heading, lines, x, y, color) {
  api.components.panel({
    x,
    y,
    width: 560,
    height: 178,
    fill: api.C.panel,
    stroke: color,
  });
  text(ctx, api, heading, x + 280, y + 38, 25, color, 'center');
  lines.forEach((line, index) =>
    text(ctx, api, line, x + 280, y + 94 + index * 38, 25, api.C.ink, 'center'),
  );
}
export function constructionText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function constructionEquation(ctx, api, v, x, y, size = 40, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function focusTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function rectangle(ctx, api, x, y, w, h, stroke = api.C.muted, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 2, 5);
}
export function cell(ctx, api, v, x, y, w = 240, h = 76, color = api.C.blue, size = 30) {
  rectangle(ctx, api, x, y, w, h, color);
  constructionText(ctx, api, v, x + w / 2, y + h * 0.65, size, color, 'center');
}
export function heading(ctx, api, v) {
  return constructionText(ctx, api, v, 170, 290, 35, api.C.ink);
}
export function caption(ctx, api, v) {
  return constructionText(ctx, api, v, 960, 1000, 24, api.C.muted, 'center');
}
export function table(ctx, api, headers, rows, x = 170, y = 385, width = 1580, rowHeight = 110) {
  const cw = width / headers.length;
  headers.forEach((h, i) => constructionText(ctx, api, h, x + i * cw + 12, y, 27, api.C.muted));
  rows.forEach((row, r) => {
    line(ctx, api, x, y + 25 + r * rowHeight, x + width, y + 25 + r * rowHeight, api.C.muted, 1);
    row.forEach((v, i) =>
      constructionText(
        ctx,
        api,
        v,
        x + i * cw + 12,
        y + 80 + r * rowHeight,
        29,
        i === 0 ? api.C.blue : api.C.ink,
      ),
    );
  });
}
export function signedValue(
  ctx,
  api,
  v,
  x,
  y,
  scale = 180,
  color = v >= 0 ? api.C.green : api.C.pink,
) {
  line(ctx, api, x, y - 35, x, y + 35, api.C.muted, 1);
  if (Math.abs(v) > 1e-8) api.arrow(ctx, x, y, x + v * scale, y, color, 5);
  constructionText(ctx, api, v.toFixed(3), x + v * scale, y - 45, 29, color, 'center');
}
export function functionCurve(
  ctx,
  api,
  fn,
  domain,
  range,
  x = 260,
  y = 390,
  width = 1040,
  height = 440,
  color = api.C.cyan,
) {
  const plot = api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: domain,
    yDomain: range,
    xTicks: [domain[0], (domain[0] + domain[1]) / 2, domain[1]],
    yTicks: [range[0], Math.round(((range[0] + range[1]) / 2) * 1e6) / 1e6, range[1]],
    fontSize: 25,
  });
  const points = Array.from(
    {
      length: 121,
    },
    (_, i) => {
      const u = domain[0] + ((domain[1] - domain[0]) * i) / 120;
      return {
        x: u,
        y: fn(u),
      };
    },
  );
  api.teaching.curve({
    plot,
    points,
    color,
    width: 5,
    progress: 1,
  });
  return plot;
}
