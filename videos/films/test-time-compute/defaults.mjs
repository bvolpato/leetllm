import { ttMix, ttSmooth } from './arithmetic.mjs';
export function originalText(ctx, api, v, x, y, n = 36, k = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, n, k, a);
}
export function originalEquation(ctx, api, v, x, y, n = 48, k = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, n, k, a);
}
export function text(ctx, api, s, x, y, z = 31, k = api.C.ink, a = 'left') {
  return api.text(ctx, String(s), x, y, z, k, a);
}
export function card(ctx, api, s, x, y, w = 370, h = 90, k = api.C.blue, z = 30) {
  const shape = api.rect(ctx, x, y, w, h, api.C.panel, k, 10);
  String(s)
    .split('\n')
    .forEach((line, i, lines) =>
      text(
        ctx,
        api,
        line,
        x + w / 2,
        y + h / 2 + (i - (lines.length - 1) / 2) * z * 1.28 + z * 0.34,
        z,
        k,
        'center',
      ),
    );
  return shape;
}
export function focusTarget(ctx, api, name, fn) {
  return api.focus.target(name, fn);
}
export function arrow(ctx, api, x1, y1, x2, y2, k = api.C.muted) {
  return api.arrow(ctx, x1, y1, x2, y2, k, 4);
}
export function fillStrip(ctx, api, count, x, y, w, k, label) {
  api.rect(ctx, x, y, w, 56, null, api.C.muted, 0);
  if (count > 0) api.rect(ctx, x, y, w * count, 56, k, undefined, 0);
  if (label) text(ctx, api, label, x + w / 2, y + 93, 27, k, 'center');
}
export function movingCard(ctx, api, label, x1, y1, x2, y2, p, k = api.C.cyan) {
  const q = ttSmooth(p);
  card(ctx, api, label, ttMix(x1, x2, q), ttMix(y1, y2, q), 170, 65, k, 25);
}
