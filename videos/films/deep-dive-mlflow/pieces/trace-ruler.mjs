export function traceRuler(ctx, api, root, ticks) {
  const { C } = api;
  const x = (ms) => 435 + (1310 * ms) / root;
  api.text(ctx, 'Elapsed time (ms)', 142, 281, 28, C.muted);
  api.line(ctx, x(0), 300, x(root), 300, C.muted, 2);
  for (const t of ticks) {
    api.line(ctx, x(t), 290, x(t), 311, C.muted, 3);
    api.text(ctx, String(t), x(t), 273, 27, C.muted, 'center');
  }
  return x;
}
export function span(
  ctx,
  api,
  x,
  label,
  start,
  end,
  y,
  color,
  progress,
  nested = false,
  durationPlacement = 'above-bar',
) {
  const { C } = api;
  const nameX = nested ? 188 : 142;
  api.text(ctx, label, nameX, y + 33, nested ? 27 : 33, nested ? C.muted : C.ink);
  if (progress <= 0) return;
  const width = (x(end) - x(start)) * progress;
  api.rect(ctx, x(start), y, width, nested ? 26 : 44, color, undefined, 0);
  if (progress >= 1) {
    const belowName = durationPlacement === 'below-name';
    const durationX = belowName ? nameX : x(start);
    const durationY = belowName ? y + 64 : y - 10;
    api.text(ctx, end - start + ' ms', durationX, durationY, 25, color);
  }
}
