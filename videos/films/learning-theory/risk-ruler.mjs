import { delta, unionRadius } from './fixtures.mjs';
import { line, text } from './defaults.mjs';

export function riskCheck(errors, tickets, pool = 1) {
  const observed = errors / tickets;
  const radius = unionRadius(pool, tickets, delta);
  const upper = Math.min(1, observed + radius);
  return { observed, radius, upper, passes: upper < releaseGate };
}

export const releaseGate = 0.2;
export const percent = (risk, digits = 2) => (100 * risk).toFixed(digits) + '%';

export function drawRiskRuler(ctx, api, { min, max, ticks, rows, axisY }) {
  const { C } = api;
  const x = (value) => 475 + (1250 * (value - min)) / (max - min);
  const gate = x(releaseGate);
  line(ctx, api, x(min), axisY, x(max), axisY, C.muted, 3);
  for (const tick of ticks) {
    line(ctx, api, x(tick), axisY - 8, x(tick), axisY + 8, C.muted, 3);
    text(ctx, api, percent(tick, 0), x(tick), axisY + 56, 33, C.muted, 'center');
  }
  text(ctx, api, '20% release gate', gate, rows[0].y - 115, 34, C.pink, 'center');
  for (const { name, detail, y, check, showObserved, extension = 0, showUpper = false } of rows) {
    text(ctx, api, name, 110, y - 6, 43, C.ink);
    text(ctx, api, detail, 110, y + 39, 30, C.muted);
    line(ctx, api, x(min), y, x(max), y, C.muted, 2);
    if (showObserved) {
      const start = x(check.observed);
      const end = x(check.observed + (check.upper - check.observed) * extension);
      if (extension > 0) {
        line(ctx, api, start, y, end, y, C.cyan, 12);
        line(ctx, api, end, y - 15, end, y + 15, C.cyan, 5);
      }
      api.circle(ctx, start, y, 13, C.yellow);
      text(ctx, api, percent(check.observed), start, y + 58, 32, C.yellow, 'center');
      if (showUpper) text(ctx, api, percent(check.upper), end, y - 37, 43, C.cyan, 'center');
    }
    line(ctx, api, gate, y - 23, gate, y + 23, C.pink, 5);
  }
}
