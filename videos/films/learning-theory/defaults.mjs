export function focusOn(api, id, draw) {
  return api.focus ? api.focus.target(id, draw) : draw();
}

export function cueProgress(state, id) {
  return state.cues?.[id]?.progress ?? 0;
}

export function cueEnded(state, id) {
  return state.cues?.[id]?.phase === 'after';
}

export function text(ctx, api, v, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 45, color = api.C.ink, align = 'center') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function line(ctx, api, x0, y0, x1, y1, color = api.C.muted, width = 3) {
  return api.line(ctx, x0, y0, x1, y1, color, width);
}
export function box(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 9);
}
export function glow(ctx, api, color, paint) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  paint();
  ctx.restore();
}
export function ticket(ctx, api, i, x, y, error, size = 44, opacity = 1) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  box(ctx, api, x, y, size, size, error ? api.C.pink : api.C.blue);
  text(
    ctx,
    api,
    String(i + 1).padStart(2, '0'),
    x + size / 2,
    y + size * 0.68,
    Math.max(20, size * 0.47),
    error ? api.C.pink : api.C.blue,
    'center',
  );
  ctx.restore();
}
export function axis(ctx, api, x, y, width, max = 0.6, ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) {
  line(ctx, api, x, y, x + width, y, api.C.muted, 3);
  for (const value of ticks) {
    const px = x + (width * value) / max;
    line(ctx, api, px, y - 8, px, y + 8);
    text(ctx, api, value.toFixed(2), px, y + 45, 27, api.C.muted, 'center');
  }
  return (value) => x + (width * value) / max;
}
export function interval(ctx, api, x, y, width, risk, radius, color = api.C.cyan, axisMax = 0.6) {
  const map = (value) => x + (width * value) / axisMax,
    lo = Math.max(0, risk - radius),
    hi = Math.min(1, risk + radius);
  line(ctx, api, map(lo), y, map(hi), y, color, 6);
  line(ctx, api, map(lo), y - 9, map(lo), y + 9, color);
  line(ctx, api, map(hi), y - 9, map(hi), y + 9, color);
  api.circle(ctx, map(risk), y, 8, color);
}
