export function visualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, text, x, y, size = 32, color = api.C.ink, align = 'center') {
  return api.text(ctx, text, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  opacity = 1,
  height = 90,
  fontSize = 31,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    baselineOffset: fontSize * (label.includes('\n') ? -0.36 : 0.34),
    padding: 13,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    opacity,
  });
}
export function link(
  ctx,
  api,
  from,
  to,
  progress,
  color = api.C.cyan,
  toGap = 20,
  particle = true,
) {
  return api.components.fade(progress, () => {
    const route = api.connect(ctx, from, to, {
      color,
      width: 3,
      fromGap: 20,
      toGap,
    });
    if (particle)
      api.components.particle({
        points: [route.from, route.to],
        progress,
        radius: 7,
        fill: color,
      });
  });
}
export function drawPromptText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function drawPromptCard(
  ctx,
  api,
  label,
  x,
  y,
  w = 620,
  color = api.C.blue,
  h = 80,
  size = 29,
) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    font: String(label).includes('_') ? 'mono' : 'sans',
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawPromptRows(
  ctx,
  api,
  entries,
  x,
  y,
  w = 700,
  { active = -1, colors = [] } = {},
) {
  return entries.map(([key, value], i) => {
    const yy = y + i * 76,
      color = colors[i] ?? (i === active ? api.C.cyan : api.C.muted);
    api.line(ctx, x, yy + 55, x + w, yy + 55, api.C.line, 1);
    drawPromptText(ctx, api, key, x + 14, yy + 35, 27, color);
    drawPromptText(
      ctx,
      api,
      value,
      x + w - 16,
      yy + 35,
      28,
      i === active ? api.C.cyan : api.C.ink,
      'right',
    );
    return {
      x: x + w / 2,
      y: yy + 28,
    };
  });
}
export function drawPromptNote(ctx, api, text) {
  return drawPromptText(ctx, api, text, 960, 1000, 27, api.C.muted, 'center');
}
export function drawPromptCells(
  ctx,
  api,
  values,
  x,
  y,
  { size = 62, gap = 13, color = api.C.blue, labels = true } = {},
) {
  return values.map((v, i) => {
    const xx = x + i * (size + gap);
    api.rect(ctx, xx, y, size, size, api.C.panel, color, 2);
    if (labels)
      drawPromptText(
        ctx,
        api,
        v,
        xx + size / 2,
        y + size * 0.65,
        Math.min(29, size * 0.48),
        color,
        'center',
      );
    return {
      x: xx + size / 2,
      y: y + size / 2,
    };
  });
}
