export function text(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function codeText(ctx, api, s, x, y, size = 36, color = api.C.ink) {
  return api.text(ctx, s, x, y, size, color, 'left', 'mono');
}
export function equation(ctx, api, s, x, y, size = 42, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, w = 380, color = api.C.cyan, h = 100, font = 'sans') {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 32,
    padding: 12,
    font,
  });
}
export function footer(ctx, api, s) {
  return text(ctx, api, s, 960, 950, 28, api.C.muted, 'center');
}
export function constructionText(
  ctx,
  api,
  s,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(s), x, y, size, color, align, font);
}
export function constructionCode(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return constructionText(ctx, api, s, x, y, size, color, align, 'mono');
}
export function focusProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function constructionFooter(ctx, api, s) {
  return constructionText(ctx, api, s, 960, 972, 27, api.C.muted, 'center');
}
export function box(ctx, api, title, lines, x, y, w, h, color = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 12);
  constructionText(ctx, api, title, x + 22, y + 42, 27, color);
  lines.forEach((line, i) =>
    constructionCode(
      ctx,
      api,
      line,
      x + 22,
      y + 94 + i * 43,
      Math.min(30, lines.length > 4 ? 26 : 30),
      api.C.ink,
    ),
  );
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function label(ctx, api, s, x, y, color = api.C.ink, size = 30) {
  return constructionText(ctx, api, s, x, y, size, color, 'center');
}
export function arrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, color, 3);
}
export function table(
  ctx,
  api,
  headers,
  rows,
  x = 190,
  y = 350,
  w = 1540,
  rowH = 105,
  widths = null,
) {
  const cols = widths || headers.map(() => 1 / headers.length);
  let xx = x;
  headers.forEach((name, i) => {
    constructionText(ctx, api, name, xx + 18, y - 25, 27, api.C.muted);
    xx += w * cols[i];
  });
  rows.forEach((row, r) => {
    const yy = y + r * rowH;
    api.rect(ctx, x, yy, w, rowH - 12, api.C.panel, api.C.line || api.C.muted, 8);
    let cx = x;
    row.forEach((v, j) => {
      constructionText(
        ctx,
        api,
        v,
        cx + 18,
        yy + 54,
        27,
        j === 0 ? api.C.blue : api.C.ink,
        'left',
        /[_{}]/.test(String(v)) ? 'mono' : 'sans',
      );
      cx += w * cols[j];
    });
  });
}
