import { chapterCard, text } from '../defaults.mjs';
import { motion, passed } from '../ledger.mjs';
import { rayBackpressure } from '../model.mjs';

export function drawWindow(ctx, scene, state, api) {
  const { C } = api;
  const finish = motion(state, 'window-fill', 0);
  const take = motion(state, 'window-take', 1);
  const refill = motion(state, 'window-refill', 2);
  const consumed = passed(state, 'window-take', 1);
  const submitted = passed(state, 'window-refill', 2);
  const first = rayBackpressure(Math.floor(finish * 3));
  const next = rayBackpressure(4);
  const admitted = submitted ? next.submitted : first.submitted;
  const received = consumed ? next.consumed.length : 0;
  const centers = [790, 1030, 1270];
  const y = 555;
  const slip = (label, center, color, top = y) =>
    chapterCard(ctx, api, label, center - 80, top - 53, 160, color, 106, 38);

  api.focus.target('window-source', () => {
    text(ctx, api, 'At driver', 286, 345, 45, C.ink, 'center');
    text(ctx, api, 'Next document', 286, 420, 30, C.muted, 'center');
    if (refill === 0 || submitted) slip(submitted ? '5' : '4', 286, C.blue);
    text(ctx, api, 9 - admitted + ' unsubmitted', 286, y + 124, 30, C.muted, 'center');
  });
  text(ctx, api, 'Submitted, awaiting consumption', 1030, 345, 44, C.ink, 'center');
  api.focus.target('window-slots', () => {
    for (const [i, center] of centers.entries()) {
      const firstSlot = i === 0;
      const ready = first.ready.some((task) => task.id === i);
      const drawSlot = () => {
        api.rect(ctx, center - 102, y - 84, 204, 168, C.panel, C.muted, 11);
        if (!firstSlot || take === 0) slip(String(i + 1), center, ready ? C.green : C.cyan);
        if (firstSlot && submitted) slip(String(next.submitted), center, C.cyan);
        const status =
          firstSlot && consumed ? (submitted ? 'running' : 'open') : ready ? 'ready' : 'running';
        text(
          ctx,
          api,
          status,
          center,
          y - 114,
          33,
          status === 'ready' ? C.green : C.muted,
          'center',
        );
      };
      if (firstSlot) api.focus.target('window-first', drawSlot);
      else drawSlot();
    }
  });
  text(ctx, api, 'Sink', 1630, 345, 45, C.ink, 'center');
  api.focus.target('window-delivery', () => {
    api.rect(ctx, 1510, y - 84, 240, 168, C.panel, C.muted, 11);
    if (take > 0) {
      // Carry the selected value below the two occupied slots.
      const lift = Math.min(1, 4 * take, 4 * (1 - take));
      const across = Math.max(0, Math.min(1, 2 * (take - 0.25)));
      slip('1', centers[0] + (1630 - centers[0]) * across, C.green, y + 171 * lift);
    }
    text(
      ctx,
      api,
      consumed ? 'consumed' : 'busy',
      1630,
      y - 114,
      33,
      consumed ? C.green : C.yellow,
      'center',
    );
  });
  api.focus.target('window-arrival', () => {
    api.arrow(ctx, 407, y, 642, y, C.blue, 3);
    if (refill > 0 && !submitted) slip('4', 286 + (centers[0] - 286) * refill, C.blue);
  });
  api.focus.target('window-count', () => {
    text(
      ctx,
      api,
      admitted +
        ' submitted  −  ' +
        received +
        ' consumed  =  ' +
        (admitted - received) +
        ' outstanding',
      960,
      840,
      52,
      C.ink,
      'center',
    );
    text(
      ctx,
      api,
      state.beat === 1 && consumed
        ? 'Window limit 3. How many slots are free?'
        : 'Window limit   3',
      960,
      925,
      33,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'window',
  draw: drawWindow,
  cues: [
    'window-fill',
    'window-gate',
    'window-select',
    'window-take',
    'window-refill',
    'window-total',
  ],
};
