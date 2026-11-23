import { ticketTexts } from './fixtures.mjs';
import { sampleModel } from './model.mjs';
export function text(ctx, api, C, v, x, y, size = 32, color = C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function math(ctx, api, C, v, x, y, size = 48, color = C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function panel(ctx, api, C, c, x, y, w, h, color = C.cyan) {
  return c.panel({
    x,
    y,
    width: w,
    height: h,
    fill: C.panel,
    stroke: color,
  });
}
export function card(
  ctx,
  api,
  C,
  c,
  label,
  x,
  y,
  w,
  h = 100,
  color = C.cyan,
  size = 32,
  font = 'sans',
) {
  return c.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: C.panel,
    stroke: color,
    textColor: C.ink,
    fontSize: size,
    font,
    padding: 16,
  });
}
export function target(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function foot(ctx, api, C, v) {
  return text(ctx, api, C, v, 960, 1010, 21, C.muted, 'center');
}
export function tag(ctx, api, C, c, v, x, y, color = C.cyan) {
  return card(ctx, api, C, c, v, x, y, 165, 58, color, 27);
}
export function ticket(
  ctx,
  api,
  C,
  c,
  x,
  y,
  w = 700,
  h = 170,
  color = C.cyan,
  label = ticketTexts[0],
) {
  panel(ctx, api, C, c, x, y, w, h, color);
  text(ctx, api, C, 'TICKET 1', x + 28, y + 43, 24, color);
  text(ctx, api, C, label, x + 28, y + 106, Math.min(43, w / 17), C.ink);
}
export function advancedCode(ctx, api, C, v, x, y, size = 29, color = C.ink, align = 'center') {
  return api.text(ctx, v, x, y, size, color, align, 'mono');
}
export function extensionCode(ctx, api, C, v, x, y, size = 28, color = C.ink, align = 'center') {
  return api.text(ctx, v, x, y, size, color, align, 'mono');
}
export function withMpsRootFrame(ctx, scene, state, api, paint) {
  const { C, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state);
  paint(ctx, scene, state, api, C, c, t, s);
}
export function withMpsAdvancedFrame(ctx, scene, state, api, C, c, s, paint) {
  const t = api.teaching;
  paint(ctx, scene, state, api, C, c, t, s);
}
export function withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paint) {
  const id = scene.id,
    t = api.teaching;
  target(ctx, api, id + '-mechanism', () => {
    paint(ctx, scene, state, api, C, c, t, s, id);
  });
}
