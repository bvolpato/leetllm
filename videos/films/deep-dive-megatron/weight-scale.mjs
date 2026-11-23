export function drawWeightScale(ctx, api, { min, step, ticks, saved, lanes }) {
  const { C } = api;
  const left = 550,
    right = 1770,
    top = 713,
    gap = 157,
    tickY = 963;
  const x = (value) => left + ((right - left) * (value - min)) / (step * (ticks - 1));

  api.focus.target('weight-scale', () => {
    for (let i = 0; i < ticks; i++) {
      const value = Number((min + step * i).toFixed(3));
      const at = x(value);
      api.line(ctx, at, tickY - 12, at, tickY + 8, C.muted, 2);
      api.text(ctx, String(value), at, tickY + 53, 29, C.muted, 'center');
    }
    api.line(ctx, left, tickY, right, tickY, C.muted, 3);
    api.text(ctx, 'Weight', left - 42, tickY + 9, 31, C.muted, 'right');
    api.line(ctx, x(saved), top + 25, x(saved), top + gap - 88, C.muted, 2);
    api.line(ctx, x(saved), top + gap + 25, x(saved), tickY - 15, C.muted, 2);
  });

  lanes.forEach(({ label, color, next, progress, detail, showValue = progress === 1 }, i) => {
    const y = top + i * gap;
    const start = x(saved);
    const tip = start + (x(next) - start) * progress;
    api.focus.target(i ? 'candidate-lane' : 'reference-lane', () => {
      api.text(ctx, label, 110, y + 9, 37, color);
      if (detail) api.text(ctx, detail, 110, y + 55, 29, C.muted);
      api.line(ctx, left, y, right, y, C.muted, 2);
      if (progress > 0) api.line(ctx, start, y, tip, y, color, 9);
      api.circle(ctx, start, y, 10, C.bg, color, 3);
      api.circle(ctx, tip, y, 13, color);
      if (showValue) api.text(ctx, next.toFixed(2), tip, y - 23, 43, color, 'center');
    });
  });
}
