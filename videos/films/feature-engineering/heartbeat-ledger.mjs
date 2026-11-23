import { clock } from './arithmetic.mjs';

export function drawHeartbeatLedger(
  ctx,
  api,
  { records, cutoff, domain, ticks, selected, compared = false, now },
) {
  const { C } = api;
  const x0 = 720,
    x1 = 1750;
  const onRuler = (minute) => x0 + ((minute - domain[0]) / (domain[1] - domain[0])) * (x1 - x0);
  const text = (label, x, y, size, color) => api.text(ctx, label, x, y, size, color, 'center');
  const cutX = onRuler(cutoff);
  text('Ping sent', 220, 308, 33, C.ink);
  text('Scorer could read it', 488, 308, 33, C.ink);
  text(clock(cutoff) + ' decision', cutX, 252, 38, C.yellow);
  const floor = 386 + records.length * 83;
  for (const [i, row] of records.entries()) {
    const y = 389 + i * 83;
    const rejected = compared && (row.available > cutoff || row.event > cutoff);
    const color = row === selected ? C.green : rejected ? C.pink : C.cyan;
    text(clock(row.event), 220, y + 12, 40, color);
    text(clock(row.available), 488, y + 12, 40, color);
    const outside = row.available < domain[0] ? 'earlier' : row.event > domain[1] ? 'later' : null;
    if (outside) {
      const left = outside === 'earlier';
      const edge = left ? x0 : x1;
      const d = left ? 1 : -1;
      api.arrow(ctx, edge + d * 82, y, edge + d * 4, y, color, 3);
      text(outside, edge + d * 153, y + 10, 27, color);
    } else {
      const from = onRuler(row.event),
        to = onRuler(row.available);
      api.line(ctx, from, y, to, y, color, 6);
      api.circle(ctx, from, y, 8, color);
      api.circle(ctx, to, y, 10, C.bg, color, 4);
    }
    if (row === selected) api.line(ctx, 135, y + 27, 568, y + 27, C.green, 3);
  }
  api.line(ctx, x0, floor, x1, floor, C.muted, 2);
  ticks.forEach((value) => {
    const x = onRuler(value);
    api.line(ctx, x, floor, x, floor + 12, C.muted, 2);
    text(clock(value), x, floor + 49, 27, C.muted);
  });
  api.line(ctx, cutX, 276, cutX, floor - 16, C.yellow, 3);
  if (now !== undefined) {
    const x = onRuler(now);
    api.line(ctx, x, 346, x, floor - 16, C.blue, 3);
    text('Now ' + clock(now), x + 103, 334, 29, C.blue);
  }
}
