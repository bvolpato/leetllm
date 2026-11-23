import { line, text } from '../defaults.mjs';

export function resolutionRows(ctx, api, { rates, counts, visible, showRates }) {
  const { C } = api;
  const left = counts ? 1100 : 595;
  const width = counts ? 355 : 825;
  text(
    ctx,
    api,
    'Questions resolved without escalation within 24 hours',
    145,
    counts ? 245 : 255,
    38,
  );
  if (counts) {
    text(ctx, api, 'Resolved / assigned users', 595, 318, 32, C.muted);
    text(ctx, api, 'Share resolved', left, 318, 32, C.muted);
  }
  ['A   Current prompt', 'B   Citation prompt'].forEach((name, i) => {
    const y = (counts ? 368 : 339) + i * 110;
    const color = i ? C.cyan : C.blue;
    text(ctx, api, name, 145, y + 19, 37, color);
    if (!visible[i]) return;
    if (counts) {
      const [resolved, users] = counts[i];
      text(
        ctx,
        api,
        resolved.toLocaleString('en-US') + ' / ' + users.toLocaleString('en-US'),
        595,
        y + 20,
        51,
        color,
      );
    }
    api.rect(ctx, left, y - 18, width, 47, C.panel, undefined, 3);
    if (showRates) {
      api.rect(ctx, left, y - 18, width * rates[i], 47, color, undefined, 3);
      text(ctx, api, (100 * rates[i]).toFixed(1) + '%', left + width + 55, y + 21, 49, color);
    }
  });
}

// The intro has a limit but no time observation. The next worksheet supplies one.
export function latencyRuler(ctx, api, { limit, change, progress = 0, compared = false }) {
  const { C } = api;
  const x = (ms) => 205 + (1390 * ms) / 500;
  const y = 815;
  text(ctx, api, 'Added p95 response time', 145, 650, 40);
  line(ctx, api, x(0), y, x(500), y, C.muted, 4);
  for (const ms of [0, 100, 200, 300, 400, 500]) {
    line(ctx, api, x(ms), y, x(ms), y + 12, C.muted, 3);
    text(ctx, api, ms + (ms === 500 ? ' ms' : ''), x(ms), y + 50, 29, C.muted, 'center');
  }
  line(ctx, api, x(limit), y - 124, x(limit), y + 3, C.yellow, 5);
  text(ctx, api, limit + ' ms limit', x(limit), y - 138, 35, C.yellow, 'center');
  if (change === undefined || progress === 0) return;
  const endpoint = x(change);
  // Uncover the measured span. Only its real endpoint carries a reading.
  line(ctx, api, x(0), y - 34, x(change * progress), y - 34, C.cyan, 13);
  if (progress < 1) return;
  line(ctx, api, endpoint, y - 62, endpoint, y - 13, C.cyan, 5);
  text(ctx, api, '+' + change + ' ms', endpoint, y - 77, 36, C.cyan, 'center');
  if (compared && change > limit) {
    line(ctx, api, x(limit), y - 34, endpoint, y - 34, C.pink, 13);
    text(
      ctx,
      api,
      change - limit + ' ms over',
      (endpoint + x(limit)) / 2,
      y + 103,
      38,
      C.pink,
      'center',
    );
  }
}
