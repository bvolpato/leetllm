import { mix } from './arithmetic.mjs';
export function originalText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function originalEquation(ctx, api, v, x, y, z = 44) {
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
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function originalTransfer(ctx, api, source, target, color = api.C.cyan) {
  return api.connect(ctx, source, target, {
    color,
    gap: 16,
  });
}
export function runtimeText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function runtimeTile(ctx, api, v, x, y, w = 330, color = api.C.cyan, h = 80, size = 30) {
  return api.components.card({
    label: String(v),
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function runtimeTitle(ctx, api, v) {
  return runtimeText(ctx, api, v, 960, 285, 36, api.C.yellow, 'center');
}
export function runtimeRule(ctx, api, v, y = 945, color = api.C.cyan, size = 32) {
  return runtimeText(ctx, api, v, 960, y, size, color, 'center');
}
export function runtimeNote(ctx, api, v) {
  return runtimeText(ctx, api, v, 960, 1020, 25, api.C.muted, 'center');
}
export function runtimeRow(
  ctx,
  api,
  values,
  y,
  { x = 600, pitch = 275, color = api.C.blue, size = 33 } = {},
) {
  return values.map((v, i) =>
    runtimeTile(ctx, api, v, x + i * pitch, y, pitch - 20, color, 76, size),
  );
}
export function runtimeWire(ctx, api, x1, y1, x2, y2, p, color = api.C.cyan) {
  api.line(ctx, x1, y1, x2, y2, api.C.muted, 2);
  if (p > 0) {
    api.line(ctx, x1, y1, mix(x1, x2, p), mix(y1, y2, p), color, 4);
    const d = Math.hypot(x2 - x1, y2 - y1);
    if (p * d > 14 && (1 - p) * d > 14) api.circle(ctx, mix(x1, x2, p), mix(y1, y2, p), 7, color);
  }
}
export function runtimeTrace(
  ctx,
  api,
  { lanes, intervals, domain = [0, 10], clock = domain[1], y = 390, height = 440 },
) {
  return api.teaching.timeline({
    x: 160,
    y,
    width: 1580,
    height,
    domain,
    time: clock,
    lanes: lanes.map((id) => ({
      id,
      label: id,
    })),
    intervals: intervals.map((v) => ({
      ...v,
      lane: v.lane ?? v.id,
      color: v.color ?? api.C.blue,
      label: v.label ?? `${v.start}→${v.end}`,
    })),
    ticks: Array.from(
      {
        length: 6,
      },
      (_, i) => domain[0] + (i * (domain[1] - domain[0])) / 5,
    ),
    labelWidth: 300,
    fontSize: 27,
    color: api.C.muted,
    trackColor: api.C.panel,
  });
}
