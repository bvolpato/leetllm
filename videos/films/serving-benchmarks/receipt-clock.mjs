import { servingRequestMetrics } from './model.mjs';
import { text } from './defaults.mjs';

// The arrival cutoff and the last terminal event share this client clock.
export function drawReceiptClock(ctx, api, rows, { windowEnd, horizon, until }) {
  const { C } = api;
  const x = (ms) => 275 + (ms / horizon) * 1065;
  const top = 337,
    spacing = rows.length > 6 ? 54 : 69;
  const bottom = top + (rows.length - 1) * spacing + 20;
  text(ctx, api, '0 s', x(0), 254, 29, C.muted);
  text(ctx, api, windowEnd / 1000 + ' s · arrivals close', x(windowEnd), 254, 30, C.cyan);
  text(ctx, api, horizon / 1000 + ' s', x(horizon), 254, 30, C.yellow);
  api.line(ctx, x(windowEnd), 275, x(windowEnd), bottom, '#55829a', 3);
  api.line(ctx, x(horizon), 275, x(horizon), bottom, '#9d884c', 3);
  text(ctx, api, 'Outcome', 1450, 254, 30, C.muted, 'left');
  rows.forEach((r, i) => {
    const m = servingRequestMetrics(r);
    const yy = top + i * spacing;
    const finished = r.terminal <= until;
    const color = !finished
      ? C.muted
      : m.qualified
        ? C.green
        : r.status === 'timeout'
          ? C.yellow
          : C.red;
    text(ctx, api, r.id, 128, yy + 10, 32, C.ink, 'left');
    api.line(ctx, x(r.scheduled), yy, x(Math.min(until, r.terminal)), yy, color, 5);
    api.line(ctx, x(r.scheduled), yy - 11, x(r.scheduled), yy + 11, C.cyan, 3);
    api.circle(ctx, x(r.sent), yy, 6, C.cyan);
    api.circle(ctx, x(Math.min(until, r.terminal)), yy, 9, color);
    const outcome = !finished
      ? 'still waiting'
      : m.qualified
        ? 'qualified'
        : r.status === 'timeout'
          ? 'timeout'
          : r.quality
            ? 'first token late'
            : 'failed quality';
    text(ctx, api, outcome, 1450, yy + 10, 30, color, 'left');
  });
}
