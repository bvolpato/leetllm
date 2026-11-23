export function focusTarget(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, s, x, y, z = 34, col = api.C.ink, a = 'left') {
  return api.text(ctx, s, x, y, z, col, a);
}
export function equation(ctx, api, s, x, y, z = 46, col = api.C.ink, a = 'left') {
  return api.math(ctx, s, x, y, z, col, a);
}
export function rowMatrix(ctx, api, values, x, y, col = api.C.cyan) {
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: 125,
    gap: 8,
    format: (v) => v.toFixed(2),
    style: {
      fill: api.C.panel,
      stroke: col,
      textColor: col,
      fontSize: 34,
      font: 'mono',
      padding: 10,
    },
  });
}
export function originalAxes(ctx, api) {
  return api.teaching.axes({
    x: 320,
    y: 380,
    width: 850,
    height: 420,
    equalUnits: true,
    xDomain: [0, 1.3],
    yDomain: [0, 1.3],
    xTicks: [0, 1],
    yTicks: [0, 1],
    xLabel: 'finance direction in the toy space',
    yLabel: 'river direction in the toy space',
    fontSize: 28,
  });
}
export function vector(ctx, api, a, v, col, focusId = 'embedding-state-vectors') {
  const o = a.point(0, 0),
    at = a.point(v[0], v[1]);
  const paint = () => {
    api.arrow(ctx, o.x, o.y, at.x, at.y, col, 5);
    api.circle(ctx, at.x, at.y, 12, col);
  };
  if (col === '#8d9cb966') paint();
  else focusTarget(ctx, api, focusId, paint);
}
export function extensionText(ctx, api, s, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, color, align, 'sans');
}
export function centeredText(ctx, api, s, x, y, size = 38, color = api.C.ink) {
  return extensionText(ctx, api, s, x, y, size, color, 'center');
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function arrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  if (Math.hypot(x2 - x1, y2 - y1) > 0.3) api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function card(ctx, api, label, x, y, w, color = api.C.cyan, h = 80, size = 30) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: size,
    padding: 10,
    radius: 10,
  });
}
export function axes(ctx, api, x, y, w, h, domainX, domainY, ticks = [0, 1]) {
  return api.teaching.axes({
    x,
    y,
    width: w,
    height: h,
    equalUnits: true,
    xDomain: domainX,
    yDomain: domainY,
    xTicks: ticks,
    yTicks: ticks,
    fontSize: 24,
    gridColor: api.C.muted + '22',
  });
}
export function vectorArrow(ctx, api, axes, v, color, from = [0, 0], width = 5) {
  const a = axes.point(...from),
    z = axes.point(...v);
  arrow(ctx, api, a.x, a.y, z.x, z.y, color, width);
  if (Math.hypot(v[0] - from[0], v[1] - from[1]) > 0.001) api.circle(ctx, z.x, z.y, 7, color);
}
export function footer(ctx, api, s) {
  return centeredText(ctx, api, s, 960, 1020, 26, api.C.muted);
}
export function numberMatrix(
  ctx,
  api,
  themeColors,
  fmt,
  values,
  x,
  y,
  {
    cell = 92,
    color = themeColors.cyan,
    label,
    rowNames,
    columns,
    visible = () => true,
    format = fmt,
  } = {},
) {
  const width = values[0].length * (cell + 7) - 7;
  if (label) centeredText(ctx, api, label, x + width / 2, y - (columns ? 80 : 35), 30, color);
  rowNames?.forEach((name, i) =>
    extensionText(
      ctx,
      api,
      name,
      x - 24,
      y + i * (cell + 7) + cell * 0.64,
      27,
      themeColors.muted,
      'right',
    ),
  );
  columns?.forEach((name, i) =>
    centeredText(ctx, api, name, x + i * (cell + 7) + cell / 2, y - 20, 24, themeColors.muted),
  );
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: cell,
    gap: 7,
    format: (v, r, c) => (visible(r, c) ? (typeof v === 'number' ? format(v) : String(v)) : '?'),
    style: {
      fill: themeColors.panel,
      stroke: themeColors.border,
      textColor: color,
      fontSize: Math.min(
        30,
        (cell - 24) /
          (Math.max(
            ...values.flat().map((v) => String(typeof v === 'number' ? format(v) : v).length),
          ) *
            0.6),
      ),
      font: 'mono',
      padding: 8,
    },
  });
}
