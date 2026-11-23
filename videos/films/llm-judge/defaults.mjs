import { candidates } from './fixtures.mjs';
import { lessonFont } from '../../lib/fonts.mjs';
import { wrap as wrapText } from '../../lib/scene.mjs';
export function text(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function codeText(ctx, api, v, x, y, size = 30, color = api.C.ink) {
  return api.text(ctx, v, x, y, size, color, 'center', 'mono');
}
export function equation(ctx, api, v, x, y, size = 40, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function withFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function cueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function withOpacity(ctx, api, alpha, fn) {
  ctx.save();
  try {
    ctx.globalAlpha *= alpha;
    return fn();
  } finally {
    ctx.restore();
  }
}
export function wrapLines(ctx, api, value, width, size = 30) {
  ctx.save();
  ctx.font = lessonFont(size);
  const lines = String(value)
    .split('\n')
    .flatMap((row) => wrapText(ctx, row, width));
  ctx.restore();
  return lines;
}
export function textBlock(
  ctx,
  api,
  value,
  x,
  y,
  width,
  size = 30,
  color = api.C.ink,
  lineHeight = size * 1.3,
) {
  const lines = wrapLines(ctx, api, value, width, size);
  lines.forEach((row, i) => text(ctx, api, row, x, y + i * lineHeight, size, color));
  return lines.length * lineHeight;
}
export function panel(
  ctx,
  api,
  id,
  title,
  body,
  x,
  y,
  width,
  height,
  color = api.C.cyan,
  alpha = 1,
) {
  return withFocus(ctx, api, id, () =>
    withOpacity(ctx, api, alpha, () => {
      const shape = api.rect(ctx, x, y, width, height, api.C.panel, color, 14);
      api.labelScope(
        ctx,
        {
          x: x + 16,
          y: y + 12,
          width: width - 32,
          height: height - 24,
        },
        () => {
          if (title) text(ctx, api, title, x + 22, y + 39, 27, color);
          if (body)
            textBlock(ctx, api, body, x + 22, y + (title ? 83 : 40), width - 44, 29, api.C.ink, 37);
        },
        {
          padding: 0,
        },
      );
      return shape;
    }),
  );
}
export function answer(
  ctx,
  api,
  identity,
  slot,
  x,
  y,
  width = 760,
  height = 210,
  alpha = 1,
  target = identity + '-answer',
) {
  return panel(
    ctx,
    api,
    target,
    (slot ? slot + ' · ' : '') + identity,
    identity === 'stepwise'
      ? candidates[identity].replace(' Next:', '\nNext:').replace(' 2.', '\n2.')
      : candidates[identity],
    x,
    y,
    width,
    height,
    identity === 'compact' ? api.C.green : api.C.cyan,
    alpha,
  );
}
export function policyLine(ctx, api, id = 'shared-policy', y = 270) {
  return withFocus(ctx, api, id, () => {
    text(
      ctx,
      api,
      'DEP-27  ·  threshold crossed → stop rollout → run rollback',
      130,
      y,
      31,
      api.C.blue,
    );
  });
}
export function footer(ctx, api, v, color = api.C.muted) {
  return text(ctx, api, v, 960, 1035, 26, color, 'center');
}
export function accountingCueComplete(ctx, api, id) {
  return api.focus.progress(id, 0) === 1;
}
export function accountingText(ctx, api, v, x, y, size = 34, color = api.C.ink, align = 'center') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function accountingEquation(
  ctx,
  api,
  v,
  x,
  y,
  size = 46,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, v, x, y, size, color, align);
}
export function accountingCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  opacity = 1,
  height = 86,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 30,
    baselineOffset: 30 * (0.34 - 0.7 * (label.split('\n').length - 1)),
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    opacity,
  });
}
