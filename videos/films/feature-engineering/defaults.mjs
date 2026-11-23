import { clock } from './arithmetic.mjs';
export function retainedFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function retainedText(
  ctx,
  api,
  value,
  x,
  y,
  size = 34,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, value, x, y, size, color, align);
}
export function retainedMath(
  ctx,
  api,
  value,
  x,
  y,
  size = 46,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function retainedCard(
  ctx,
  api,
  label,
  x,
  y,
  color = api.C.blue,
  width = 365,
  height = 88,
  opacity = 1,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 32,
    padding: 12,
    opacity,
  });
}
export function drawFeatureConstructionText(
  ctx,
  api,
  s,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawFeatureConstructionEquation(ctx, api, s, x, y, size = 38, color = api.C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawFeatureConstructionL(ctx, api, x, y, xx, yy, c = api.C.muted, w = 2) {
  return api.line(ctx, x, y, xx, yy, c, w);
}
export function drawFeatureConstructionArrow(ctx, api, x, y, xx, yy, c = api.C.cyan) {
  return api.arrow(ctx, x, y, xx, yy, c, 3);
}
export function drawFeatureConstructionHead(ctx, api, s) {
  return drawFeatureConstructionText(ctx, api, s, 960, 255, 34, api.C.ink, 'center');
}
export function drawFeatureConstructionNote(ctx, api, s) {
  return drawFeatureConstructionText(ctx, api, s, 960, 1030, 26, api.C.muted, 'center');
}
export function drawFeatureConstructionBox(
  ctx,
  api,
  s,
  x,
  y,
  w = 350,
  h = 70,
  c = api.C.cyan,
  size = 29,
) {
  const shape = api.rect(ctx, x - w / 2, y - h / 2, w, h, api.C.panel, c, 2);
  drawFeatureConstructionText(ctx, api, s, x, y + size * 0.34, size, c, 'center');
  return shape;
}
export function drawFeatureConstructionStage(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawFeatureConstructionVector(ctx, api, values, x, y, cell = 160, colors = null) {
  return values.forEach((v, i) => {
    api.rect(ctx, x + i * cell, y, cell - 8, 75, api.C.panel, colors?.[i] ?? api.C.cyan, 2);
    drawFeatureConstructionText(
      ctx,
      api,
      Number.isInteger(v) ? String(v) : v.toFixed(3),
      x + i * cell + (cell - 8) / 2,
      y + 49,
      29,
      colors?.[i] ?? api.C.cyan,
      'center',
    );
  });
}
export function drawFeatureConstructionTemporal(
  ctx,
  api,
  records,
  cutoff,
  job,
  selected,
  hideSelection = false,
) {
  const plot = api.teaching.axes({
    x: 260,
    y: 400,
    width: 1300,
    height: 380,
    xDomain: [480, 640],
    yDomain: [480, 640],
    xTicks: [480, 540, 600, 640],
    yTicks: [480, 540, 600, 640],
    xLabel: 'event time · minutes after midnight',
    yLabel: 'scoring-path availability',
    fontSize: 23,
  });
  const v = plot.point(cutoff, 480),
    h = plot.point(480, cutoff);
  drawFeatureConstructionL(ctx, api, v.x, 400, v.x, 780, api.C.yellow, 3);
  drawFeatureConstructionL(ctx, api, 260, h.y, 1560, h.y, api.C.yellow, 3);
  records.forEach((r, i) => {
    const q = plot.point(r.event, r.available),
      ok = r.job === job && r.event <= cutoff && r.available <= cutoff,
      ink = hideSelection ? api.C.blue : ok ? api.C.cyan : api.C.pink;
    api.circle(ctx, q.x, q.y, selected === i ? 17 : 11, ink);
    drawFeatureConstructionText(
      ctx,
      api,
      'E' + (i + 1),
      q.x + 20,
      q.y + (r.available > cutoff ? -18 : 30),
      23,
      ink,
    );
    const col = i % 2,
      row = Math.floor(i / 2);
    drawFeatureConstructionText(
      ctx,
      api,
      'E' + (i + 1) + ' ' + r.job + ' · ' + clock(r.event) + ' / ' + clock(r.available),
      260 + col * 770,
      910 + row * 40,
      23,
      ink,
    );
  });
  drawFeatureConstructionText(
    ctx,
    api,
    'cutoff ' + clock(cutoff) + ' on BOTH axes',
    960,
    885,
    30,
    api.C.yellow,
    'center',
  );
  return plot;
}
