import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';
import { QUEUE_EVENTS } from '../fixtures.mjs';
import { queueState } from '../model.mjs';

// Stop on the same ownership transitions the voice names, including the empty slot between owners.
function queueAt(p) {
  const events = QUEUE_EVENTS;
  const index = (type, slot, beat, request) =>
    events.findIndex(
      (e) =>
        e.type === type &&
        e.slot === slot &&
        e.beat === beat &&
        (request === undefined || e.request === request),
    ) + 1;
  const steps = [
    ['queue-load', index('claim', 3, 0)],
    ['queue-done', index('complete', 0, 0)],
    ['queue-release', index('release', 0, 1)],
    ['queue-enter', index('publish', 0, 1, 5)],
    ['queue-claim', index('claim', 0, 1)],
    ['queue-six', index('claim', 1, 1)],
    ['queue-drain', events.length],
  ];
  let count = 0;
  for (const [id, endpoint] of steps) count += Math.floor((endpoint - count) * p(id));
  return queueState(events.slice(0, count));
}

export function drawWorkers(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const q = queueAt(p);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const pitch = 371,
    x0 = 385,
    w = 287;
  const entering = p('queue-enter');
  api.focus.target('queue-waiting', () => {
    txt('Waiting line', 145, 277, 34, C.muted);
    const pending = Array.from({ length: q.pending }, (_, i) => q.accepted + i + 1);
    pending.forEach((request, i) => {
      if (request === 5 && entering > 0 && entering < 1) return;
      const x = x0 + i * 200;
      api.rect(ctx, x, 216, 155, 80, C.panel, i ? C.muted : C.yellow, 12);
      txt('R' + request, x + 77, 271, 39, i ? C.ink : C.yellow, 'center');
    });
    if (!pending.length) txt('empty', x0, 273, 40, C.muted);
  });

  api.focus.target('queue-slots', () => {
    q.slots.forEach((slot, i) => {
      const x = x0 + i * pitch;
      const held = slot.state === 'COMPLETED';
      const color = held ? C.yellow : slot.request ? C.cyan : C.muted;
      txt('S' + slot.id, x + w, 427, 42, C.ink, 'right');
      api.rect(ctx, x, 463, w, 142, C.panel, color, 15);
      if (i !== 0 || entering === 0 || entering === 1)
        txt(slot.request ? 'R' + slot.request : 'free', x + w / 2, 554, 59, color, 'center');
      const owner = held
        ? 'CPU reader'
        : slot.worker
          ? 'worker ' + slot.worker
          : slot.request
            ? 'published'
            : 'available';
      txt(owner, x + w / 2, 668, 34, color, 'center');
      if (held) txt('reading ' + slot.result, x + w / 2, 736, 39, C.yellow, 'center');
    });
    if (entering > 0 && entering < 1) {
      const x = x0 + entering * ((w - 155) / 2);
      const y = 216 + entering * 277;
      api.rect(ctx, x, y, 155, 80, C.panel, C.yellow, 12);
      txt('R5', x + 77, y + 55, 39, C.yellow, 'center');
    }
  });

  api.focus.target('queue-counts', () => {
    const last = q.last;
    const summary =
      !q.pending && q.owned === 0
        ? 'Every reader has finished'
        : q.slots[0].state === 'COMPLETED' && q.slots[0].request === 1
          ? p('queue-question') > 0 && state.beat === 0
            ? 'Which slot can take R5?'
            : 'R1 computed   ·   reader active'
          : last?.type === 'release' && last.slot === 0
            ? 'S0 is free for the next request'
            : q.slots[0].request === 5
              ? 'R5 now owns S0'
              : 'Four storage slots';
    txt(summary, 960, 855, 43, C.ink, 'center');
    txt(
      q.accepted +
        ' admitted     ·     ' +
        q.completed +
        ' computed     ·     ' +
        q.released +
        ' released after reading     ·     ' +
        q.pending +
        ' waiting',
      960,
      967,
      33,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'workers',
  draw: drawWorkers,
  cues: [
    'queue-load',
    'queue-done',
    'queue-question',
    'queue-release',
    'queue-enter',
    'queue-claim',
    'queue-six',
    'queue-drain',
    'queue-totals',
  ],
};
