import { queueState } from '../model.mjs';
import { progress } from '../phrase-clock.mjs';

export function drawQueue(ctx, scene, state, api) {
  const { C } = api;
  const q = queueState(state);
  const p = (id) => progress(scene, state, id);
  const shown = Math.ceil(3 * p('queue-waiting')) + Math.ceil(2 * p('queue-setup'));
  const groups = q.groups.slice(0, shown);
  const queued = groups.filter((g) => g.status === 'queued').length;
  const running = groups.length - queued;
  return api.focus.target('queue-trace', () => {
    api.text(ctx, 'Warm worker', 115, 267, 36, C.ink);
    if (p('queue-threshold') > 0)
      api.text(
        ctx,
        `Stop launching at ${q.threshold} queued groups`,
        1805,
        267,
        36,
        C.yellow,
        'right',
      );
    api.line(ctx, 115, 305, 1805, 305, C.muted, 2);
    api.text(ctx, `Waiting for the trainer   /   ${queued} queued`, 185, 411, 36, C.blue);
    api.line(ctx, 167, 602, 1740, 602, C.blue, 5);
    api.line(ctx, 167, 572, 167, 602, C.blue, 5);
    api.text(ctx, `Generation   /   ${running} running`, 185, 677, 36, C.cyan);
    for (const g of groups) {
      const color = g.status === 'queued' ? C.blue : C.cyan;
      api.rect(ctx, g.x, g.y, 252, 110, C.panel, color, 10);
      api.text(ctx, g.id, g.x + 126, g.y + 78, 58, color, 'center');
    }
    if (p('queue-threshold') > 0) {
      const angle = q.launch ? -Math.PI / 3 : 0;
      const stop = q.launch ? C.green : C.pink;
      api.text(ctx, 'New launches', 185, 806, 29, C.muted);
      api.circle(ctx, 429, 794, 10, stop);
      api.line(ctx, 429, 794, 429 + 125 * Math.cos(angle), 794 + 125 * Math.sin(angle), stop, 8);
      api.text(ctx, q.launch ? 'OPEN' : 'CLOSED', 594, 806, 36, stop);
    }
    const footer =
      state.beat === 0
        ? 'Both running groups finish before the trainer takes any. How many will be waiting?'
        : state.beat === 1
          ? `${q.queued.length} queued + ${q.running} running = ${q.submitted} submitted`
          : 'Before the next update, check completion age and the policy each group sampled.';
    if (p('queue-threshold') === 1)
      api.text(ctx, footer, 960, 960, 36, state.beat === 0 ? C.yellow : C.ink, 'center');
  });
}
export default {
  id: 'queue',
  draw: drawQueue,
  cues: [
    'queue-waiting',
    'queue-setup',
    'queue-threshold',
    'queue-first-completion',
    'queue-still-running',
    'queue-second-completion',
    'queue-age',
  ],
};
