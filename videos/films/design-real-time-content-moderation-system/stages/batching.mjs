import { arrivals, scheduled } from '../model.mjs';

export function drawBatching(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id);
  const [burst, singleD, singleE] = scheduled;
  const [a, b, c, d, e] = arrivals;
  const clock =
    state.beat === 0
      ? a.at + (b.at - a.at) * p('batching-b') + (c.at - b.at) * p('batching-c')
      : state.beat === 1
        ? burst.at + (d.at - burst.at) * p('batching-d')
        : d.at +
          (singleD.at - d.at) * p('batching-send-d') +
          (e.at - singleD.at) * p('batching-e') +
          (singleE.at - e.at) * p('batching-send-e');
  const emitted = scheduled.filter((batch) => batch.at <= clock);
  const waiting = arrivals.filter(
    (row) => row.at <= clock && !emitted.some((batch) => batch.rows.includes(row)),
  );
  const label = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  const xAt = (ms) => 220 + 46 * ms;
  focus.target('batch-tray', () => {
    label('Batch forming', 150, 300, 39, C.blue);
    for (let i = 0; i < 3; i++) {
      const x = 150 + 175 * i;
      const row = waiting[i];
      api.rect(ctx, x, 350, 150, 120, row ? C.blue : C.panel, row ? C.blue : C.muted, 9);
      if (row) label(row.id, x + 75, 432, 58, C.bg, 'center');
    }
    label('3 places  /  5 ms from oldest arrival', 150, 545, 32);
  });
  focus.target('batch-delivery', () => {
    label('Sent to the available worker', 960, 300, 38, C.cyan);
    emitted.forEach((batch, i) => {
      const y = 354 + i * 64;
      const ids = batch.rows.map((r) => r.id).join('   ');
      label(batch.at + ' ms', 960, y + 35, 33);
      label(ids, 1130, y + 35, 37, C.cyan);
      label(batch.rows.length === 3 ? 'full' : 'timer', 1480, y + 35, 33, C.muted);
    });
    if (emitted.length === 0) api.line(ctx, 960, 409, 1730, 409, C.muted, 2);
  });
  focus.target('batch-ruler', () => {
    const y = 770;
    api.line(ctx, xAt(0), y, xAt(33), y, C.muted, 3);
    for (const row of arrivals) {
      const x = xAt(row.at);
      api.line(ctx, x, y - 10, x, y + 12, C.blue, 3);
      label(row.id, x, y + 62, 34, C.blue, 'center');
    }
    for (const row of [d, e]) label(row.at + ' ms', xAt(row.at), y + 108, 29, C.muted, 'center');
    if (waiting.length) {
      const stop = xAt(waiting[0].at + 5);
      api.line(ctx, stop, y - 88, stop, y + 14, C.yellow, 3);
      label('oldest + 5 ms', stop, y - 114, 29, C.yellow, 'center');
    }
    api.circle(ctx, xAt(clock), y, 13, C.cyan);
    label('Clock  ' + Math.floor(clock) + ' ms', 150, 967, 41, C.cyan);
  });
  focus.target('batch-question', () => {
    const waits = scheduled.flatMap((batch) => batch.rows.map((row) => batch.at - row.at));
    const totalWait = waits.reduce((sum, value) => sum + value, 0);
    const message =
      state.beat === 1 && focus.visible('batching-ask')
        ? 'When must D leave, and who goes with it?'
        : clock >= singleE.at
          ? 'Wait across A–E    ' +
            waits.join(' + ') +
            ' = ' +
            (focus.progress('batching-total') === 1 ? totalWait : '?') +
            ' request-ms'
          : clock >= d.at
            ? 'D arrives at 20 ms     •     E arrives at 27 ms'
            : 'A at 0 ms     •     B at 1 ms     •     C at 2 ms';
    label(message, 1755, 965, 33, C.ink, 'right');
  });
}
export default {
  id: 'batching',
  draw: drawBatching,
  cues: [
    'batching-start',
    'batching-b',
    'batching-c',
    'batching-d',
    'batching-ask',
    'batching-send-d',
    'batching-e',
    'batching-send-e',
    'batching-total',
  ],
};
