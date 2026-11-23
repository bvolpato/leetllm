import { cueStep } from '../construction.mjs';
import { queuePlan } from '../arithmetic.mjs';

const arrivals = [0, 5, 10, 15];
const service = arrivals.map(() => 20);
const one = queuePlan(arrivals, service, 1);
const two = queuePlan(arrivals, service, 2);
const deadline = 40;
const x = (age) => 395 + 12.6 * age;

export function drawFreshPlan(ctx, scene, state, api) {
  const { C } = api;
  const arrivalsShown = cueStep(state, 'sp-fresh-plan-0', 0, 0.08, 0.42);
  const elapsed = one.at(-1).finish * cueStep(state, 'sp-fresh-plan-1', 1, 0.03, 0.62);
  const oneResult = cueStep(state, 'sp-fresh-one-result', 1, 0.73, 0.86);
  const change = cueStep(state, 'sp-fresh-plan-2', 2, 0.08, 0.28);
  const slide = cueStep(state, 'sp-fresh-two-starts', 3, 0.07, 0.42);
  const twoResult = cueStep(state, 'sp-fresh-two-result', 3, 0.52, 0.75);
  api.focus.target('sp-fresh-plan-visual', () => {
    api.text(ctx, 'Arrived at', 155, 334, 32, C.muted);
    api.text(ctx, '20 ms of service each', x(0), 267, 37, C.cyan);
    api.text(ctx, '40 ms timer', x(deadline), 334, 38, C.yellow, 'center');
    api.line(ctx, x(deadline), 365, x(deadline), 839, C.yellow, 4);
    api.text(ctx, change > 0 ? '2 workers' : '1 worker', 1710, 266, 42, C.ink, 'right');
    if (elapsed > 0) api.text(ctx, 'Start → finish (ms)', 1570, 334, 32, C.muted, 'center');
    one.forEach((row, i) => {
      if (arrivalsShown * 4 <= i) return;
      const y = 436 + 111 * i;
      api.text(ctx, 'R' + row.id + '    ' + row.arrival + ' ms', 155, y + 12, 34, C.ink);
      api.circle(ctx, x(0), y, 9, C.ink);
      const age = Math.max(0, Math.min(elapsed - row.arrival, row.total));
      const newWait = row.wait + slide * (two[i].wait - row.wait);
      if (change > 0) {
        api.rect(ctx, x(row.wait), y - 30, x(row.service) - x(0), 60, null, C.muted, 2);
      }
      if (change > 0 && slide === 0) return;
      const wait = Math.min(age, newWait);
      if (wait > 0) api.line(ctx, x(0), y, x(wait), y, C.muted, 9);
      const served = Math.min(row.service, Math.max(0, age - newWait));
      if (served > 0) {
        api.rect(ctx, x(newWait), y - 25, x(served) - x(0), 50, C.cyan, null, 2);
      }
      if (served === row.service && (slide === 0 || slide === 1)) {
        const total = newWait + row.service;
        const afterDeadline = total > deadline;
        api.text(
          ctx,
          'total ' + total + ' ms',
          x(total) + (afterDeadline ? 12 : -8),
          y - 39,
          30,
          afterDeadline ? C.pink : C.ink,
          afterDeadline ? 'left' : 'right',
        );
        const schedule = slide === 1 ? two[i] : row;
        api.text(ctx, schedule.start + ' → ' + schedule.finish, 1570, y + 13, 35, C.ink, 'center');
      }
    });
    for (const tick of [0, 10, 20, 30, 40, 50, 60]) {
      api.text(ctx, String(tick), x(tick), 894, 28, C.muted, 'center');
    }
    api.text(ctx, 'Time since each request arrived (ms)', x(0), 965, 35, C.muted);
    const plan = twoResult === 1 ? two : change === 0 && oneResult === 1 ? one : null;
    if (plan)
      api.text(
        ctx,
        plan.filter((r) => r.total <= deadline).length + ' / 4 within own 40 ms',
        1738,
        967,
        40,
        C.ink,
        'right',
      );
  });
}

export default {
  id: 'fresh-plan',
  draw: drawFreshPlan,
  cues: [
    'sp-fresh-plan-0',
    'sp-fresh-plan-1',
    'sp-fresh-one-result',
    'sp-fresh-plan-2',
    'sp-fresh-two-starts',
    'sp-fresh-two-result',
  ],
};
