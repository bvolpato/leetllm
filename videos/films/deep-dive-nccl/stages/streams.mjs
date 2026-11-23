import { heard, sampleModel } from '../construction.mjs';

export function drawStreams(ctx, scene, state, api) {
  const { C, focus } = api;
  const m = sampleModel('streams', state);
  const hostReturn = 1.2;
  const host = m.time >= hostReturn;
  const released = heard(state, 2, 'streams-release');
  const xAt = (t) => 455 + 155 * t;
  const rows = [
    ['Input producer', 0, 1, C.blue],
    ['Reduce-scatter', 1, 7, C.cyan],
    ['Other backward work', 2, 6, C.blue],
  ];
  focus.target('streams-trace', () => {
    rows.forEach(([name, start, finish, color], r) => {
      const y = 391 + 115 * r;
      api.text(ctx, name, 393, y + 13, 33, C.ink, 'right');
      api.rect(ctx, xAt(start), y - 25, xAt(finish) - xAt(start), 50, C.panel, C.muted, 5);
      const elapsed = Math.min(finish, Math.max(start, m.time)) - start;
      if (elapsed > 0) api.rect(ctx, xAt(start), y - 25, elapsed * 155, 50, color, undefined, 5);
    });
    const x = xAt(m.time);
    api.line(ctx, x, 329, x, 670, C.yellow, 3);
    api.text(ctx, String(Number(m.time.toFixed(1))) + ' ms', x, 308, 38, C.yellow, 'center');
    for (let i = 0; i <= 8; i++) {
      api.line(ctx, xAt(i), 686, xAt(i), 700, C.muted, 2);
      api.text(ctx, String(i), xAt(i), 744, 34, C.muted, 'center');
    }
    api.text(ctx, 'Time on device (ms)', 1080, 800, 31, C.muted, 'center');
  });
  focus.target('streams-reader', () => {
    const note = released
      ? 'Rank 2 reads slot 2'
      : heard(state, 1, 'streams-wait')
        ? 'Rank 2 reader waits'
        : host
          ? 'Can rank 2 read now?'
          : 'Rank 2 output   ·   slot 2';
    api.rect(ctx, 1060, 876, 650, 94, C.panel, released ? C.green : C.yellow, 12);
    api.text(ctx, note, 1385, 935, 41, released ? C.green : C.yellow, 'center');
    const enqueue = host ? 'Host returned at 1.2 ms' : 'Host is queuing the work';
    api.text(ctx, enqueue, 208, 935, 38, C.muted);
  });
}
export default {
  id: 'streams',
  draw: drawStreams,
  cues: [
    'streams-input',
    'streams-host',
    'streams-ask',
    'streams-wait',
    'streams-overlap',
    'streams-complete',
    'streams-release',
  ],
};
