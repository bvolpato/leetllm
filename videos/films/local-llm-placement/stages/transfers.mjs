import { stream } from '../model.mjs';
import { cueProgress } from '../worksheet.mjs';

export function drawTransfers(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const resident = stream(0),
    mixed = stream(1);
  const left = 423,
    width = 1290;
  const milliseconds = (span) => span.seconds * 1000;
  const x = (ms) => left + (width * ms) / 100;
  const mixedCase = state.beat >= 1;
  const current = mixedCase ? mixed : resident;
  focus.target('payload', () => {
    text('Weight bytes read in one decode step', 135, 253, 35);
    let cursor = left;
    for (const span of current.spans) {
      const w = (width * span.gb) / current.payload;
      const host = span.name === 'Host transfer';
      api.rect(ctx, cursor, 304, w, 93, host ? C.pink : C.blue, undefined, 4);
      text(
        `${span.gb} GB  ·  ${host ? 'host' : 'device'}`,
        cursor + w / 2,
        364,
        34,
        C.bg,
        'center',
      );
      cursor += w;
    }
    text('Device   500 GB/s', left, 459, 31, C.blue);
    if (mixedCase) text('Host link   25 GB/s', 1330, 459, 31, C.pink);
  });
  focus.target('stopwatch', () => {
    text('Serial time', 135, 550, 33);
    for (const ms of [0, 20, 40, 60, 80, 100]) {
      api.line(ctx, x(ms), 559, x(ms), 815, C.muted, 1.5);
      text(ms + ' ms', x(ms), 540, 27, C.muted, 'center');
    }
    function track(label, y, spans, progress) {
      text(label, 135, y + 42, 31);
      for (const [i, span] of spans.entries()) {
        const ms = milliseconds(span) * progress[i];
        if (ms > 0)
          api.rect(
            ctx,
            x(span.start * 1000),
            y,
            (width * ms) / 100,
            59,
            i ? C.pink : C.blue,
            undefined,
            3,
          );
      }
    }
    track('Device only', 592, resident.spans, [p('resident-read')]);
    if (mixedCase) track('Device + host', 730, mixed.spans, [p('device-leg'), p('host-leg')]);
  });
  focus.target('duration', () => {
    let line = 'Time for each segment = bytes ÷ bandwidth';
    if (p('resident-read') === 1)
      line = '7.6 GB ÷ 500 GB/s = ' + milliseconds(resident.spans[0]).toFixed(1) + ' ms';
    if (mixedCase) line = '5.6 GB ÷ 500 GB/s  +  2 GB ÷ 25 GB/s';
    if (state.beat === 1 && p('ask-leg') > 0)
      line = 'Which takes longer: the device read or the host transfer?';
    if (p('host-leg') === 1) line = '11.2 ms + 80 ms = ?';
    if (p('serial-total') === 1)
      line =
        milliseconds(mixed.spans[0]).toFixed(1) +
        ' ms + ' +
        milliseconds(mixed.spans[1]).toFixed(0) +
        ' ms = ' +
        (mixed.total * 1000).toFixed(1) +
        ' ms';
    text(line, 135, 924, 43, C.ink);
    text(
      'Serial weight traffic only   ·   compute, cache traffic, unpacking and launches excluded',
      135,
      996,
      28,
      C.muted,
    );
  });
}
export default {
  id: 'transfers',
  draw: drawTransfers,
  cues: [
    'weight-payload',
    'resident-read',
    'split-bytes',
    'ask-leg',
    'device-leg',
    'host-leg',
    'serial-total',
    'trace-bytes',
  ],
};
