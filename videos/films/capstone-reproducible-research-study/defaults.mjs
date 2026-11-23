export function drawOriginalResearchText(
  ctx,
  api,
  v,
  x,
  y,
  z = 29,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawOriginalResearchCard(ctx, api, v, x, y, w = 600, color = api.C.cyan, h = 110) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    padding: 13,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawOriginalResearchCorridor(ctx, api, y, position, color) {
  api.teaching.grid({
    x: 260,
    y,
    width: 1400,
    height: 130,
    rows: 1,
    columns: 7,
    labels: [
      Array.from(
        {
          length: 7,
        },
        (_, i) => String(i),
      ),
    ],
    fontSize: 34,
    padding: 13,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: api.C.ink,
  });
  api.circle(ctx, 360 + position * 200, y + 100, 16, color);
}
export function drawResearchConstructionText(
  ctx,
  api,
  v,
  x,
  y,
  z = 30,
  col = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, z, col, align);
}
export function drawResearchConstructionMid(ctx, api, v, x, y, z = 32, col = api.C.ink) {
  return drawResearchConstructionText(ctx, api, v, x, y, z, col, 'center');
}
export function drawResearchConstructionLine(ctx, api, x, y, xx, yy, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, xx, yy, col, w);
}
export function drawResearchConstructionArrow(ctx, api, x, y, xx, yy, col = api.C.cyan) {
  if (Math.hypot(x - xx, y - yy) > 1) api.arrow(ctx, x, y, xx, yy, col, 4);
}
export function drawResearchConstructionRect(
  ctx,
  api,
  x,
  y,
  w,
  h,
  col = api.C.panel,
  stroke = api.C.muted,
) {
  return api.rect(ctx, x, y, w, h, col, stroke, 0);
}
export function drawResearchConstructionDot(ctx, api, x, y, col = api.C.cyan, r = 10) {
  return api.circle(ctx, x, y, r, col);
}
export function drawResearchConstructionBox(
  ctx,
  api,
  value,
  x,
  y,
  w = 430,
  h = 100,
  col = api.C.cyan,
  z = 29,
) {
  api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: col,
    radius: 8,
  });
  const rows = String(value)
    .split('\n')
    .flatMap((v) => wrapResearchLabel(ctx, api, v, Math.floor((w - 40) / (z * 0.58))));
  rows.forEach((r, i) =>
    drawResearchConstructionMid(
      ctx,
      api,
      r,
      x + w / 2,
      y + h / 2 + (i - (rows.length - 1) / 2) * z * 1.3 + z * 0.34,
      z,
      col,
    ),
  );
}
export function drawResearchConstructionHeader(ctx, api, v, col = api.C.ink) {
  return drawResearchConstructionMid(ctx, api, v, 960, 282, 34, col);
}
export function drawResearchConstructionFooter(ctx, api, v, col = api.C.muted) {
  return drawResearchConstructionMid(ctx, api, v, 960, 1000, 26, col);
}
export function drawResearchConstructionCorridor(
  ctx,
  api,
  y,
  pos,
  { labels = true, color = api.C.cyan } = {},
) {
  drawResearchConstructionRect(ctx, api, 200, y, 1500, 115, api.C.panel, api.C.muted);
  for (let j = 0; j < 7; j++) {
    if (j)
      drawResearchConstructionLine(
        ctx,
        api,
        180 + j * 220,
        y,
        180 + j * 220,
        y + 61,
        api.C.muted,
        2,
      );
    if (labels)
      drawResearchConstructionMid(
        ctx,
        api,
        j,
        290 + j * 220,
        y + 41,
        29,
        j === 6 ? api.C.green : api.C.ink,
      );
  }
  drawResearchConstructionDot(ctx, api, 290 + 220 * pos, y + 86, color, 16);
}
export function drawResearchConstructionAxis(
  ctx,
  api,
  x,
  y,
  w,
  min,
  max,
  { ticks = [min, 0, max], label = '' } = {},
) {
  drawResearchConstructionLine(ctx, api, x, y, x + w, y, api.C.muted, 3);
  for (const v of ticks) {
    const xx = x + ((v - min) / (max - min)) * w;
    drawResearchConstructionLine(ctx, api, xx, y - 10, xx, y + 10, api.C.muted, 2);
    drawResearchConstructionMid(ctx, api, v.toFixed(2), xx, y + 45, 26, api.C.muted);
  }
  if (label) drawResearchConstructionMid(ctx, api, label, x + w / 2, y + 95, 28, api.C.muted);
  return (v) => x + ((v - min) / (max - min)) * w;
}
export function drawResearchConstructionInterval(
  ctx,
  api,
  y,
  lo,
  hi,
  point,
  { show = true, title = '', decision = '', color = api.C.cyan, min = -0.04, max = 0.26 } = {},
) {
  const X = drawResearchConstructionAxis(ctx, api, 300, y, 1320, min, max, {
    ticks: [min, 0, 0.1, max],
  });
  drawResearchConstructionMid(ctx, api, title, 960, y - 125, 31, api.C.ink);
  if (show) {
    drawResearchConstructionLine(ctx, api, X(lo), y - 48, X(hi), y - 48, color, 8);
    for (const x of [lo, hi])
      drawResearchConstructionLine(ctx, api, X(x), y - 64, X(x), y - 32, color, 4);
    drawResearchConstructionDot(ctx, api, X(point), y - 48, api.C.yellow, 12);
    drawResearchConstructionMid(
      ctx,
      api,
      `[${formatResearchSigned(ctx, api, lo)}, ${formatResearchSigned(ctx, api, hi)}] · mean ${formatResearchSigned(ctx, api, point)}`,
      960,
      y + 145,
      31,
      api.C.yellow,
    );
  }
  if (decision) drawResearchConstructionMid(ctx, api, decision, 960, y + 205, 31, color);
  return X;
}
export function drawResearchConstructionSmallGrid(ctx, api, rows, x, y, w, h, colors = []) {
  const rh = h / rows.length,
    cols = Math.max(...rows.map((r) => r.length)),
    cw = w / cols;
  rows.forEach((r, i) =>
    r.forEach((v, j) => {
      drawResearchConstructionRect(
        ctx,
        api,
        x + j * cw,
        y + i * rh,
        cw,
        rh,
        api.C.panel,
        api.C.muted,
      );
      drawResearchConstructionMid(
        ctx,
        api,
        v,
        x + (j + 0.5) * cw,
        y + (i + 0.5) * rh + 10,
        28,
        colors[i] ?? api.C.ink,
      );
    }),
  );
}
export function drawResearchConstructionResult(ctx, api, value, col = api.C.yellow, y = 916) {
  return drawResearchConstructionMid(ctx, api, value, 960, y, 35, col);
}
export function wrapResearchLabel(ctx, api, value, n) {
  const out = [];
  let a = '';
  for (const w of String(value).split(/\s+/)) {
    if ((a + ' ' + w).trim().length > n) {
      out.push(a);
      a = w;
    } else a = (a + ' ' + w).trim();
  }
  if (a) out.push(a);
  return out;
}
export function formatResearchSigned(ctx, api, v, n = 3) {
  return (v >= 0 ? '+' : '') + v.toFixed(n);
}
