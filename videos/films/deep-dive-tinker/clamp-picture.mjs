// The sample stays on the same scale as both limits when the input changes.
export function drawClampRuler(ctx, api, { lo, hi, x, expected, returned, working = null }) {
  const { C } = api;
  const unit = 315;
  const at = (value) => 570 + (value - lo) * unit;
  const y = 450;
  api.line(ctx, at(lo) - 150, y, at(hi + 1) + 145, y, C.muted, 3);
  api.line(ctx, at(lo), y, at(hi), y, C.blue, 12);
  for (let value = lo; value <= hi + 1; value++) {
    api.line(ctx, at(value), y - 12, at(value), y + 12, C.ink, 3);
    api.text(ctx, String(value), at(value), y + 57, 34, C.ink, 'center');
  }
  api.text(ctx, 'Allowed values', (at(lo) + at(hi)) / 2, y - 25, 30, C.blue, 'center');
  api.circle(ctx, at(x), y - 93, 12, C.yellow);
  api.line(ctx, at(x), y - 80, at(x), y - 58, C.yellow, 3);
  api.text(ctx, 'input x', at(x), y - 122, 36, C.yellow, 'center');
  const start = at(lo) - 150;
  const end = at(hi + 1) + 145;
  const radius = 23;
  for (const [name, value, level, color] of [
    ['Expected', expected, 579, C.blue],
    [working?.label ?? 'Returned', working?.value ?? returned, 665, C.cyan],
  ]) {
    api.text(ctx, name, 120, level + 10, 33, color);
    if (value === null) {
      api.line(ctx, start, level, end, level, C.panel, 5);
      continue;
    }
    const center = at(value);
    api.line(ctx, start, level, center - radius, level, C.panel, 5);
    api.line(ctx, center + radius, level, end, level, C.panel, 5);
    api.circle(ctx, center, level, radius, color);
    if (Number.isInteger(value))
      api.text(ctx, String(value), center, level + 11, 29, C.bg, 'center');
  }
}
