import { onlineCueProgress } from '../construction.mjs';
import { telemetryReadouts } from '../model.mjs';
import { line, text } from '../defaults.mjs';

const pp = (value) => (100 * value).toFixed(2);
const number = (n) => n.toLocaleString('en-US');

export function drawIntervalConstruction(ctx, scene, state, api) {
  const { C } = api;
  const correct = telemetryReadouts[0].correct;
  const copied = telemetryReadouts[2].naive;
  const users = ['A', 'B'];
  const arms = [correct.a, correct.b];
  const p = (name, beat) => onlineCueProgress(state, 'ci-' + name, beat);
  const duplicate = p('copies', 3) > 0;
  const rowsPerUser = duplicate ? 3 : 1;
  const x = (value) => 530 + ((100 * value + 1) / 9) * 1150;
  text(
    ctx,
    api,
    'Simulated users  ·  first eligible conversation  ·  complete 24-hour follow-up',
    145,
    247,
    30,
    C.muted,
  );
  for (const [i, arm] of arms.entries()) {
    const y = 338 + i * 109;
    const color = i ? C.cyan : C.blue;
    const n = correct.arms[i].n;
    const resolved = correct.arms[i].success;
    api.focus.target('ci-arms', () => {
      text(ctx, api, users[i], 145, y, 45, color);
      text(ctx, api, number(resolved) + ' / ' + number(n) + ' users', 233, y, 40, color);
      if (p('rates', 0) === 1) text(ctx, api, pp(arm) + '%', 735, y, 41, color);
    });
    api.focus.target('ci-error', () => {
      if (p('variance', 1) > 0) {
        const divisor = n * rowsPerUser;
        const proportion = arm.toFixed(3);
        text(
          ctx,
          api,
          proportion + ' × (1 − ' + proportion + ') / ' + number(divisor),
          1090,
          y,
          32,
          duplicate ? C.pink : color,
        );
        text(
          ctx,
          api,
          duplicate ? 'copied rows counted as people' : 'variance of this arm’s rate',
          1090,
          y + 41,
          26,
          C.muted,
        );
      }
    });
  }
  if (p('error', 1) === 1) {
    text(
      ctx,
      api,
      duplicate
        ? p('naive', 4) === 1
          ? 'Copied rows  ·  apparent SE ≈ ' + pp(copied.se) + ' pp'
          : 'Same users. What happens if we use the row counts?'
        : 'SE = √(variance A + variance B) ≈ ' + pp(correct.se) + ' pp',
      145,
      552,
      37,
      duplicate ? C.pink : C.ink,
    );
  }
  api.focus.target('ci-ruler', () => {
    const zero = x(0);
    line(ctx, api, x(-0.01), 909, x(0.08), 909, C.muted, 3);
    for (const tick of [0, 2, 4, 6, 8]) {
      line(ctx, api, x(tick / 100), 909, x(tick / 100), 923, C.muted, 3);
      text(ctx, api, String(tick), x(tick / 100), 959, 28, C.muted, 'center');
    }
    line(ctx, api, zero, 591, zero, 907, C.yellow, 4);
    text(ctx, api, 'Resolution difference in percentage points', 1070, 1011, 31, C.muted, 'center');
    if (p('rates', 0) < 1) return;
    const mid = x(correct.d);
    const showInterval = p('interval', 2);
    text(ctx, api, '4,000 users', 145, 704, 38, C.cyan);
    api.circle(ctx, mid, 692, 12, C.cyan);
    text(ctx, api, '+' + pp(correct.d) + ' pp', mid, 750, 32, C.cyan, 'center');
    if (showInterval > 0) {
      const band = (r, y, color, progress, from = [r.d, r.d]) => {
        for (const [i, endpoint] of [r.low, r.high].entries()) {
          const edge = x(from[i] + (endpoint - from[i]) * progress);
          line(ctx, api, mid, y, edge, y, color, 8);
          if (progress === 1) {
            line(ctx, api, edge, y - 15, edge, y + 15, color, 4);
            text(ctx, api, pp(endpoint), edge, y - 30, 32, color, 'center');
          }
        }
      };
      band(correct, 692, C.cyan, showInterval);
      if (duplicate) {
        text(ctx, api, '12,000 log rows', 145, 841, 37, C.pink);
        api.circle(ctx, mid, 832, 11, C.pink);
        if (p('naive', 4) > 0)
          band(copied, 832, C.pink, p('naive', 4), [correct.low, correct.high]);
      }
    }
  });
}
export default {
  id: 'interval-construction',
  draw: drawIntervalConstruction,
  cues: ['ci-rates', 'ci-variance', 'ci-error', 'ci-interval', 'ci-copies', 'ci-naive'],
};
