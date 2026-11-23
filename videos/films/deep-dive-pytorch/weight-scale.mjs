export function weightScale(ctx, api, ticks, left, right, top, bottom, digits) {
  const lo = ticks[0],
    hi = ticks.at(-1);
  const x = (value) => left + ((value - lo) / (hi - lo)) * (right - left);
  for (const tick of ticks) {
    api.text(ctx, tick.toFixed(digits), x(tick), top - 20, 31, api.C.muted, 'center');
    api.line(ctx, x(tick), top, x(tick), bottom, api.C.panel, 4);
  }
  return x;
}

export function drawStep(ctx, api, x, y, start, end, progress, color) {
  const from = x(start),
    to = x(end);
  api.circle(ctx, from, y, 12, api.C.bg, color, 4);
  if (progress <= 0) return;
  const mark = from + (to - from) * progress;
  if (Math.abs(mark - from) > 14) api.arrow(ctx, from, y, mark, y, color, 6);
  if (progress >= 1) api.circle(ctx, to, y, 10, color);
}
