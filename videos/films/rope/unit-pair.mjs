// The perpendicular from the key tip meets the query axis at their signed dot product.
export function drawUnitPair(
  ctx,
  api,
  { x, y, radius, queryAngle, keyAngle, queryLength = 1, project = true },
) {
  const { C, circle, line, arrow } = api;
  const point = (angle, length) => [x + length * Math.cos(angle), y - length * Math.sin(angle)];
  const q = point(queryAngle, radius * queryLength);
  const k = point(keyAngle, radius);
  const foot = point(queryAngle, radius * Math.cos(keyAngle - queryAngle));
  circle(ctx, x, y, radius, 'transparent', '#465267', 2);
  line(ctx, ...point(queryAngle, -radius), ...q, '#687586', 3);
  line(
    ctx,
    ...point(queryAngle + Math.PI / 2, -radius),
    ...point(queryAngle + Math.PI / 2, radius),
    '#394252',
    2,
  );
  arrow(ctx, x, y, ...q, C.cyan, 10);
  arrow(ctx, x, y, ...k, C.yellow, 6);
  if (project) {
    line(ctx, ...k, ...foot, C.muted, 3);
    line(ctx, x, y, ...foot, C.green, 5);
    circle(ctx, ...foot, 8, C.green);
  }
}

export function drawScoreRuler(ctx, api, x, y, width, score, reference) {
  const { C, line, text, circle } = api;
  const at = (value) => x + ((value + 1) * width) / 2;
  line(ctx, x, y, x + width, y, C.muted, 3);
  for (const value of [-1, 0, 1]) {
    line(ctx, at(value), y - 10, at(value), y + 10, C.muted, 3);
    text(ctx, String(value), at(value), y + 52, 31, C.muted, 'center');
  }
  if (reference !== undefined) {
    line(ctx, at(reference), y - 32, at(reference), y + 15, C.ink, 4);
  }
  if (score !== undefined) circle(ctx, at(score), y, 12, C.green);
}
