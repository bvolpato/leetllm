import { availableHeartbeat, formatClock } from '../arithmetic.mjs';
import { heartbeats } from '../fixtures.mjs';
import { receipt, spoken } from '../request-clock.mjs';

export function drawBatchOnline(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  const cutoff = 540;
  const row = availableHeartbeat(heartbeats, cutoff);
  const stream = clock.started('stream');
  const done = clock.finished('age');
  api.text(ctx, 'J-204    /    same heartbeat log', 108, 242, 34, C.muted);
  api.focus.target('batch-history', () => {
    api.text(ctx, 'Archived day', 108, 381, 45, C.ink);
    heartbeats.forEach((r, i) => {
      const x = 670 + 460 * i;
      if (i) api.line(ctx, x - 352, 358, x - 108, 358, '#5a6171', 4);
      api.rect(ctx, x - 108, 315, 216, 84, C.panel, C.blue, 7);
      api.text(ctx, r.id, x, 375, 48, C.blue, 'center');
      api.text(ctx, `arrived ${formatClock(r.available)}`, x, 466, 30, C.muted, 'center');
    });
  });
  api.focus.target('online-key', () => {
    api.text(ctx, 'Online at 09:00', 108, 611, 45, C.ink);
    api.rect(ctx, 557, 543, 530, 94, C.panel, stream ? C.cyan : C.muted, 7);
    api.text(
      ctx,
      stream ? `${row.id}   ·   worker time ${formatClock(row.event)}` : 'Job lookup',
      822,
      605,
      35,
      stream ? C.cyan : C.muted,
      'center',
    );
    if (clock.started('cached')) {
      const writtenAge = (heartbeats[0].available - row.event) / 60;
      api.text(
        ctx,
        `Age when written   ${writtenAge.toFixed(2)} h`,
        1740,
        681,
        35,
        C.pink,
        'right',
      );
    }
  });
  api.focus.target('paired-request', () =>
    receipt(ctx, api, {
      y: 835,
      label: '09:00 request on either path',
      value: done
        ? `09:00 − ${formatClock(row.event)} = ${row.ageHours} h`
        : 'Request time − worker time',
      color: done ? C.green : C.ink,
    }),
  );
  if (clock.started('capture'))
    api.text(
      ctx,
      'Capture the served row, request ID, cutoff, definition version and source progress.',
      110,
      956,
      34,
      C.blue,
    );
}
export default {
  id: 'batch-online',
  draw: drawBatchOnline,
  cues: ['batch', 'stream', 'cached', 'age', 'capture'].map((id) => 'sf-batch-online-' + id),
};
