import { bounded } from './arithmetic.mjs';
import { TOKENS } from './fixtures.mjs';
export function upgradeText(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function line(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function arrow(ctx, api, x, y, u, v, col = api.C.cyan) {
  return api.arrow(ctx, x, y, u, v, col, 3);
}
export function upgradeBox(ctx, api, v, x, y, w = 300, h = 85, col = api.C.blue, z = 30) {
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
    baselineOffset: z * 0.34,
  });
}
export function title(ctx, api, v) {
  return upgradeText(ctx, api, v, 960, 290, 35, api.C.muted, 'center');
}
export function footer(ctx, api, v, col = api.C.muted) {
  return upgradeText(ctx, api, v, 960, 1015, 28, col, 'center');
}
export function bar(ctx, api, x, y, w, h, v, col) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.border, 2);
  if (v > 0) api.rect(ctx, x, y, w * bounded(v), h, col, undefined, 0);
}
export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function equation(ctx, api, v, x, y, z = 45, col = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function card(ctx, api, v, x, y, w = 320, col = api.C.cyan) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: 90,
    fontSize: 31,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
  });
}
export function tokens(ctx, api, y, colors = [], reveal = 1) {
  return TOKENS.map((label, i) =>
    api.components.card({
      label,
      x: 200 + i * 220,
      y,
      width: 195,
      height: 82,
      fontSize: label.length > 8 ? 28 : 31,
      fill: api.C.panel,
      stroke: colors[i] ?? api.C.blue,
      textColor: colors[i] ?? api.C.ink,
      padding: 10,
      opacity: api.clamp(reveal * TOKENS.length - i, 0, 1),
    }),
  );
}
