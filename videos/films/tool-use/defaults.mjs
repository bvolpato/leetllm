export function visualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function code(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align, 'mono');
}
export function card(ctx, api, label, x, y, w = 350, color = api.C.cyan, h = 100, fontSize = 32) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    ...(label.includes('\n')
      ? {
          baselineOffset: -0.36 * fontSize,
        }
      : {}),
    padding: 12,
  });
}
export function codeCard(ctx, api, lines, x, y, w, color = api.C.cyan, h = 100, fontSize = 28) {
  const shape = card(ctx, api, '', x, y, w, color, h, fontSize);
  lines.forEach((line, i) =>
    code(
      ctx,
      api,
      line,
      x + w / 2,
      y + h / 2 + (i - (lines.length - 1) / 2) * fontSize * 1.35 + fontSize * 0.34,
      fontSize,
      color,
      'center',
    ),
  );
  return shape;
}
export function foot(ctx, api, s) {
  return text(ctx, api, s, 960, 950, 28, api.C.muted, 'center');
}
export function chapterText(
  ctx,
  api,
  text,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(
    ctx,
    String(text),
    x,
    y,
    size,
    color,
    align,
    font === 'sans' && String(text).includes('_') ? 'mono' : font,
  );
}
export function chapterLine(ctx, api, x, y, z, w, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function rectangle(
  ctx,
  api,
  x,
  y,
  w,
  h,
  fill = api.C.panel,
  stroke = api.C.muted,
  width = 1.5,
) {
  return api.rect(ctx, x, y, w, h, fill, stroke, width, 5);
}
export function chapterCode(ctx, api, text, x, y, size = 27, color = api.C.ink) {
  return chapterText(ctx, api, text, x, y, size, color, 'left', 'mono');
}
export function heading(ctx, api, text) {
  return chapterText(ctx, api, text, 150, 280, 31, api.C.ink);
}
export function footer(ctx, api, text) {
  return chapterText(ctx, api, text, 150, 1030, 24, api.C.muted);
}
export function box(ctx, api, title, detail, x, y, w = 660, color = api.C.blue, h = 120) {
  rectangle(ctx, api, x, y, w, h, api.C.panel, color, 2);
  chapterText(ctx, api, title, x + 20, y + 36, 28, color);
  (Array.isArray(detail) ? detail : [detail]).forEach((text, i) =>
    chapterText(ctx, api, text, x + 20, y + 72 + 31 * i, 24, api.C.ink),
  );
  return {
    x,
    y,
    w,
    h,
  };
}
export function table(
  ctx,
  api,
  heads,
  rows,
  x = 150,
  y = 375,
  widths = [460, 540, 550],
  rowHeight = 105,
) {
  let xx = x;
  heads.forEach((v, i) => {
    chapterText(ctx, api, v, xx, y, 25, api.C.muted);
    xx += widths[i];
  });
  rows.forEach((row, i) => {
    let xx = x;
    const yy = y + 70 + i * rowHeight;
    row.forEach((v, j) => {
      chapterText(
        ctx,
        api,
        v,
        xx,
        yy,
        j === 0 ? 27 : 28,
        j === 0 ? api.C.ink : api.C.cyan,
        'left',
        String(v).includes('_') ? 'mono' : 'sans',
      );
      xx += widths[j];
    });
    chapterLine(
      ctx,
      api,
      x,
      yy + 25,
      x + widths.reduce((a, z) => a + z, 0) - 40,
      yy + 25,
      api.C.muted,
      1,
    );
  });
}
export function bar(ctx, api, label, value, max, x, y, w = 600, color = api.C.cyan) {
  chapterText(ctx, api, label, x, y - 20, 28, color);
  rectangle(ctx, api, x, y, w, 72, api.C.panel, api.C.muted);
  api.rect(ctx, x, y, w * Math.max(0, Math.min(1, value / max)), 72, color);
}
export function pointer(ctx, api, x, y, color = api.C.yellow) {
  chapterLine(ctx, api, x, y, x + 26, y + 15, color, 3);
  chapterLine(ctx, api, x + 26, y + 15, x, y + 30, color, 3);
}
