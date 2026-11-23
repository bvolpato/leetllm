import { confidence } from './arithmetic.mjs';

// Both tracks use one x coordinate. A vertical line reads the same winner on both scales.
export function drawRuler(
  ctx,
  api,
  {
    count,
    probability,
    y,
    gap = 136,
    target,
    showReading = true,
    fromConfidence = false,
    gate,
    fractionLabel,
  },
) {
  const { C } = api;
  const left = 445;
  const right = 1688;
  const floor = 1 / count;
  const axisX = (p) => left + ((right - left) * (p - floor)) / (1 - floor);
  const x = axisX(probability);
  const bottom = y + gap;
  api.text(ctx, 'Winning probability', 108, y + 12, 32, C.ink);
  api.text(ctx, 'Choice confidence', 108, bottom + 12, 32, C.ink);
  for (const axisY of [y, bottom]) {
    api.line(ctx, left, axisY, right, axisY, C.muted, 4);
    for (const end of [left, right]) api.line(ctx, end, axisY - 11, end, axisY + 11, C.muted, 4);
  }
  api.focus.target('uniform', () => {
    api.text(ctx, count === 3 ? '⅓' : '¼', left, y - 38, 42, C.ink, 'center');
    api.text(ctx, '0', left, bottom + 58, 40, C.ink, 'center');
  });
  api.text(ctx, '1', right, y - 38, 40, C.ink, 'center');
  api.text(ctx, '1', right, bottom + 58, 40, C.ink, 'center');
  if (gate !== undefined) {
    const cutX = left + (right - left) * gate;
    api.line(ctx, cutX, bottom - 15, cutX, bottom + 20, C.yellow, 5);
    api.line(ctx, cutX, bottom + 21, cutX + 40, bottom + 65, C.yellow, 2);
    api.text(ctx, 'Gate ' + gate.toFixed(2), cutX + 51, bottom + 80, 34, C.yellow);
  }
  api.focus.target(target, () => {
    if (fromConfidence) {
      api.line(ctx, left, bottom, x, bottom, C.cyan, 6);
      api.circle(ctx, x, bottom, 12, C.cyan);
      if (x > left + 100)
        api.text(
          ctx,
          confidence(probability, count).toFixed(2),
          x,
          bottom + 66,
          49,
          C.cyan,
          'center',
        );
      if (showReading) {
        api.line(ctx, x, bottom - 12, x, y + 13, C.cyan, 4);
        api.circle(ctx, x, y, 12, C.cyan);
        api.text(ctx, fractionLabel, x, y - 36, 49, C.cyan, 'center');
      }
      return;
    }
    api.circle(ctx, x, y, 12, C.cyan);
    api.text(ctx, fractionLabel ?? probability.toFixed(2), x, y - 36, 49, C.cyan, 'center');
    if (showReading) {
      api.line(ctx, x, y + 13, x, bottom - 12, C.cyan, 4);
      api.circle(ctx, x, bottom, 12, C.cyan);
      // The ending keeps the gate label below the track. Put the moving reading between the rails.
      if (gate === undefined)
        api.text(
          ctx,
          confidence(probability, count).toFixed(2),
          x,
          bottom + 66,
          49,
          C.cyan,
          'center',
        );
      else
        api.text(
          ctx,
          confidence(probability, count).toFixed(2),
          x - 25,
          bottom - 30,
          45,
          C.cyan,
          'right',
        );
    }
  });
}
