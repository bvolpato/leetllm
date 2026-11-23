export function text(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 96, fontSize = 29) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function cueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function drawText(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'center') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function drawRectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.muted) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 10);
}
export function drawLine(ctx, api, x, y, u, v, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function withFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawEvidenceBox(
  ctx,
  api,
  id,
  lines,
  x,
  y,
  w = 500,
  h = 110,
  color = api.C.cyan,
  size = 29,
) {
  return withFocus(ctx, api, id, () => {
    drawRectangle(ctx, api, x, y, w, h, api.C.panel, color);
    String(lines)
      .split('\n')
      .forEach((s, i, a) =>
        drawText(
          ctx,
          api,
          s,
          x + w / 2,
          y + h / 2 + (i - (a.length - 1) / 2) * 35 + 10,
          size,
          color,
        ),
      );
  });
}
export function drawCaption(ctx, api, id, s, y = 990, color = api.C.muted) {
  return withFocus(ctx, api, id, () => drawText(ctx, api, s, 960, y, 29, color));
}
export function drawRow(ctx, api, id, items, y, colors = [api.C.blue, api.C.cyan, api.C.green]) {
  return items.forEach((s, i) =>
    drawEvidenceBox(
      ctx,
      api,
      id + '-' + i,
      s,
      160 + i * 580,
      y,
      500,
      110,
      colors[i % colors.length],
      27,
    ),
  );
}
export function drawRoles(ctx, api, target, y = 720) {
  return withFocus(ctx, api, target, () => {
    const xs = [350, 960, 1570],
      labels = [
        'You · release check',
        'Service owner · auth repair',
        'Release owner · stage approval',
      ],
      colors = [api.C.blue, api.C.cyan, api.C.green];
    labels.forEach((x, i) =>
      drawEvidenceBox(ctx, api, target + '-' + i, x, xs[i] - 265, y, 530, 105, colors[i], 27),
    );
  });
}
export function originalCueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function drawArtifactText(
  ctx,
  api,
  s,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function drawArtifactRectangle(
  ctx,
  api,
  x,
  y,
  w,
  h,
  fill = api.C.panel,
  stroke = api.C.muted,
) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 10);
}
export function drawArtifactLine(ctx, api, x, y, u, v, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function withArtifactFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawArtifactBox(
  ctx,
  api,
  id,
  lines,
  x,
  y,
  w,
  h = 110,
  color = api.C.cyan,
  size = 29,
) {
  return withArtifactFocus(ctx, api, id, () => {
    drawArtifactRectangle(ctx, api, x, y, w, h, api.C.panel, color);
    String(lines)
      .split('\n')
      .forEach((s, i, a) =>
        drawArtifactText(
          ctx,
          api,
          s,
          x + w / 2,
          y + h / 2 + (i - (a.length - 1) / 2) * 35 + 10,
          size,
          color,
        ),
      );
  });
}
