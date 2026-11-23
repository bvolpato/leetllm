import { SERVING_COHORT } from './fixtures.mjs';
import { servingRequestMetrics } from './model.mjs';
export function text(ctx, api, value, x, y, size = 34, color = api.C.ink, align = 'center') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function equation(ctx, api, value, x, y, size = 46, color = api.C.ink, align = 'center') {
  return api.math(ctx, value, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  color = api.C.blue,
  width = 390,
  height = 82,
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
    fontSize: 30,
    padding: 12,
    opacity,
  });
}
export function constructionText(ctx, api, v, x, y, z = 31, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function line(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function arrow(ctx, api, x, y, u, v, col = api.C.cyan) {
  return api.arrow(ctx, x, y, u, v, col, 3);
}
export function box(ctx, api, v, x, y, w = 300, h = 80, col = api.C.blue, z = 29) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: z,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
    baselineOffset: z * 0.34 - (String(v).split('\n').length - 1) * z * 0.7,
  });
}
export function title(ctx, api, v) {
  return constructionText(ctx, api, v, 960, 288, 34, api.C.muted, 'center');
}
export function footer(ctx, api, v, col = api.C.muted) {
  return constructionText(ctx, api, v, 960, 1015, 27, col, 'center');
}
export function requestColor(ctx, api, r) {
  return r.status === 'timeout'
    ? api.C.yellow
    : servingRequestMetrics(r).qualified
      ? api.C.green
      : api.C.red;
}
export function timeAxis(ctx, api, x, y, w, max, ticks) {
  line(ctx, api, x, y, x + w, y);
  ticks.forEach((t) => {
    let u = x + (t / max) * w;
    line(ctx, api, u, y - 8, u, y + 8);
    constructionText(ctx, api, String(t), u, y + 40, 24, api.C.muted, 'center');
  });
}
export function requestCohort(
  ctx,
  api,
  rows = SERVING_COHORT,
  { x = 350, y = 395, width = 1050, height = 65, max = 2600, details = true } = {},
) {
  rows.forEach((r, i) => {
    const yy = y + i * height,
      xx = (t) => x + (t / max) * width,
      col = requestColor(ctx, api, r);
    constructionText(ctx, api, r.id, x - 90, yy + 9, 25, api.C.blue);
    line(ctx, api, xx(r.scheduled), yy, xx(r.terminal), yy, col, 5);
    line(ctx, api, xx(r.scheduled), yy - 12, xx(r.scheduled), yy + 12, api.C.blue, 3);
    api.circle(ctx, xx(r.sent), yy, 6, api.C.cyan);
    for (const t of r.tokens) api.circle(ctx, xx(t), yy, 5, api.C.ink);
    api.circle(ctx, xx(r.terminal), yy, 8, col);
    if (details)
      constructionText(
        ctx,
        api,
        r.status === 'timeout'
          ? 'timeout'
          : servingRequestMetrics(r).qualified
            ? 'qualified'
            : r.quality
              ? 'TTFT fail'
              : 'quality fail',
        x + width + 35,
        yy + 9,
        24,
        col,
      );
  });
  timeAxis(
    ctx,
    api,
    x,
    y + rows.length * height + 10,
    width,
    max,
    (max > 3000 ? [0, 1000, 2000, 3000, 4000] : [0, 500, 1000, 1500, 2000, 2500]).filter(
      (t) => t <= max,
    ),
  );
}
