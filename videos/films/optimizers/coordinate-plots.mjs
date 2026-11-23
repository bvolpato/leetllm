import { fmt, loss } from './arithmetic.mjs';

// Both coordinates use the same error scale and the same loss scale.
export function coordinatePlot(
  ctx,
  api,
  j,
  { before = 1, after = 1, move = 0, slope, product, endpoint, opening = false },
) {
  const { C } = api;
  const center = j ? 1395 : 525;
  const name = j ? 'b' : 'a';
  const color = j ? C.green : C.cyan;
  const x = (error) => center + 305 * error;
  const cost = (error) => loss(j ? [0, error] : [error, 0]);
  const y = (error) => 655 - 5.1 * cost(error);
  const current = before + (after - before) * move;

  api.text(
    ctx,
    opening ? 'Weight ' + name : 'Loss from ' + name + '     ' + (j ? '½ b²' : '50 a²'),
    center,
    305,
    45,
    color,
    'center',
  );
  api.line(ctx, x(-1.04), 655, x(1.04), 655, C.muted, 2);
  api.line(ctx, x(-1.04), 655, x(-1.04), 390, C.muted, 2);
  for (const tick of [0, 50]) {
    const height = 655 - 5.1 * tick;
    api.text(ctx, String(tick), x(-1.04) - 15, height + 8, 26, C.muted, 'right');
  }

  const points = Array.from({ length: 81 }, (_, i) => {
    const error = -1 + i / 40;
    return { x: x(error), y: y(error) };
  });
  api.path(ctx, [...points, { x: x(1), y: 655 }, { x: x(-1), y: 655 }], {
    closed: true,
    width: 0,
    fill: color + '2b',
  });
  api.path(ctx, points, { color, width: 7 });
  api.line(ctx, x(current), 730, x(current), y(current), color, 3);
  if (slope !== undefined) {
    api.line(
      ctx,
      x(before - 0.32),
      y(before) + 5.1 * slope * 0.32,
      x(before + 0.08),
      y(before) - 5.1 * slope * 0.08,
      C.yellow,
      6,
    );
  }
  api.circle(ctx, x(before), y(before), 15, C.bg, color, 3);
  api.circle(ctx, x(current), y(current), 13, color);
  api.line(ctx, x(-1.04), 730, x(1.04), 730, C.muted, 3);
  for (const [value, label] of [
    [-1, '−1'],
    [0, 'target 0'],
    [1, 'start 1'],
  ]) {
    api.line(ctx, x(value), 719, x(value), 741, C.ink, 2);
    api.text(ctx, label, x(value), 784, 29, C.muted, 'center');
  }
  api.circle(ctx, x(before), 730, 11, C.bg, color, 3);
  if (move > 0) api.line(ctx, x(before), 730, x(current), 730, color, 6);
  api.circle(ctx, x(current), 730, 8, color);
  if (slope !== undefined)
    api.text(
      ctx,
      'At +1     loss ' + fmt(cost(1)) + '     slope ' + slope,
      center,
      365,
      32,
      C.ink,
      'center',
    );
  if (product) api.text(ctx, product, center, 865, 39, color, 'center');
  if (endpoint) api.text(ctx, endpoint, center, 925, 39, C.ink, 'center');
}
