import { budgets, latency, quality } from '../fixtures.mjs';
import { chooseBudget } from '../model.mjs';
import { ttMix, ttSmooth } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';
import { sceneClock } from '../scene-clock.mjs';

export function drawBudget(ctx, scene, state, api) {
  const { C } = api,
    cue = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    text(ctx, api, s, x, y, size, color, align);
  const x = (ms) => 535 + 0.5 * ms;
  const shift = cue('tighter-budget');
  const limit = ttMix(1000, 400, ttSmooth(shift.p));
  const reveal = shift.started ? cue('tighter-winner').done : cue('chosen-budget').done;
  const selected = reveal ? chooseBudget(limit) : -1;
  label('Tokens', 132, 280, 36, C.muted);
  label('Time', 306, 280, 36, C.muted);
  label('Latency (ms)', x(0), 280, 36, C.muted);
  label('Accuracy', 1620, 280, 36, C.muted);
  for (const t of [0, 500, 1000, 1500, 2000]) {
    label(String(t), x(t), 350, 29, C.muted, 'center');
    api.line(ctx, x(t), 365, x(t), 377, C.muted, 3);
  }
  api.line(ctx, x(0), 371, x(2000), 371, C.muted, 3);
  api.focus.target('points', () => {
    budgets.forEach((n, i) => {
      const y = 458 + i * 117;
      const show = () => {
        const dot = x(latency[i]),
          color = latency[i] > limit ? C.pink : C.blue;
        label(String(n), 148, y + 19, 54);
        api.line(ctx, x(0), y, dot - 15, y, C.muted, 3);
        api.circle(ctx, dot, y, 12, color);
        if (i === selected) api.circle(ctx, dot, y, 24, '#00000000', C.green, 4);
        label(`${latency[i]} ms`, 306, y + 13, 33, color);
        label(
          `${Math.round(quality[i] * 100)}%`,
          1630,
          y + 17,
          47,
          i === selected ? C.green : C.ink,
        );
      };
      if (i === budgets.length - 1) api.focus.target('largest', show);
      else show();
    });
  });
  api.focus.target('deadline', () => {
    const dx = x(limit);
    api.line(ctx, dx, 382, dx, 851, C.yellow, 4);
    label(`${Math.round(limit)} ms limit`, dx, 905, 34, C.yellow, 'center');
  });
  api.focus.target('budget-readout', () => {
    label(
      selected >= 0 ? `chosen budget: ${budgets[selected]}` : 'Highest accuracy inside the limit?',
      960,
      1012,
      46,
      selected >= 0 ? C.green : C.ink,
      'center',
    );
  });
}

export default { id: 'budget', draw: drawBudget };
