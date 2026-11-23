export function originalText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function originalMath(ctx, api, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function originalCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 95,
  z = 30,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    ...(label.includes('\n')
      ? {
          baselineOffset: -z * 0.58,
        }
      : {}),
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function originalTransfer(ctx, api, s, source, target, color = api.C.cyan, p = s.q) {
  return api.teaching.transfer({
    source: {
      shape: source,
      opacity: 1,
    },
    target: {
      shape: target,
      opacity: 1,
    },
    progress: p,
    color,
    particle: {
      radius: 8,
      fill: color,
    },
  });
}
export function chapterText(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function chapterRect(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.muted) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 10);
}
export function chapterParagraph(ctx, api, text, x, y, w = 1500, z = 29, color = api.C.ink) {
  const rows = [];
  let line = '';
  for (const word of text.split(' ')) {
    const trial = line ? line + ' ' + word : word;
    if (trial.length > w / (z * 0.58)) {
      rows.push(line);
      line = word;
    } else line = trial;
  }
  if (line) rows.push(line);
  rows.forEach((row, i) => chapterText(ctx, api, row, x, y + i * z * 1.45, z, color));
  return rows.length * z * 1.45;
}
export function chapterLine(ctx, api, a, z, color = api.C.muted) {
  return api.line(ctx, a[0], a[1], z[0], z[1], color, 3);
}
export function chapterArrow(ctx, api, x, y, z, v, color = api.C.cyan) {
  return api.arrow(ctx, x, y, z, v, color, 3);
}
export function chapterMeter(ctx, api, label, value, max, x, y, w, color, visible = true) {
  chapterText(ctx, api, label, x, y, 27, api.C.muted);
  chapterRect(ctx, api, x, y + 20, w, 44, api.C.panel, api.C.muted);
  if (visible) {
    chapterRect(ctx, api, x, y + 20, (w * value) / max, 44, color);
    chapterText(ctx, api, value, x + w + 25, y + 54, 30, color);
  }
}
export function chapterSource(ctx, api, name, text, x, y, w, color, status = '') {
  chapterRect(ctx, api, x, y, w, 210, api.C.panel, color);
  chapterText(ctx, api, name, x + 20, y + 42, 29, color);
  chapterParagraph(ctx, api, text, x + 20, y + 85, w - 45, 25);
  if (status) chapterText(ctx, api, status, x + 20, y + 195, 23, api.C.muted);
}
export function chapterFooter(ctx, api, text, color = api.C.muted) {
  return chapterParagraph(ctx, api, text, 155, 1015, 1620, 27, color);
}
