import { batches } from '../construction.mjs';

const maxAge = 5;
const size = 3;
export function drawBatchEdge(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.progress(id) === 1;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat < 2) {
    const shifted = state.beat > 0 || focus.visible('edge-shift');
    const answered = done('edge-second');
    const xAt = (ms) => 335 + ms * 128;
    focus.target('edge-clock', () => {
      label('3 places    •    5 ms from oldest    •    worker available', 150, 266, 35);
      [0, 4, 5, 10].forEach((ms) => {
        const x = xAt(ms);
        api.line(ctx, x, 342, x, 802, ms === 5 ? C.yellow : C.muted, ms === 5 ? 3 : 1);
        label(ms + ' ms', x, 852, 29, ms === 5 ? C.yellow : C.muted, 'center');
      });
      label('First timer expires', xAt(5), 316, 31, C.yellow, 'center');
    });
    for (const [i, id] of ['X', 'Y'].entries()) {
      const arrival = i === 0 ? 0 : shifted ? 5 : 4;
      const y = 470 + 204 * i;
      const trace = batches(
        [
          { id: 'X', at: 0 },
          { id: 'Y', at: shifted ? 5 : 4 },
        ],
        size,
        maxAge,
      );
      const sent = trace.find((batch) => batch.rows.some((r) => r.id === id)).at;
      const show = shifted ? (i === 0 ? done('edge-first') : answered) : done('edge-before');
      focus.target('edge-' + id.toLowerCase(), () => {
        label('Request ' + id, 130, y + 13, 35);
        api.circle(ctx, xAt(arrival), y, 14, C.blue);
        if (show) {
          api.line(ctx, xAt(arrival), y, xAt(sent), y, C.cyan, 9);
          api.circle(ctx, xAt(sent), y, 14, C.cyan);
          label(
            id + ' sent at ' + sent + ' ms',
            xAt(sent) + (sent === 10 ? -25 : 25),
            y - 36,
            29,
            C.cyan,
            sent === 10 ? 'right' : 'left',
          );
        }
      });
    }
    focus.target('edge-outcome', () => {
      const line = shifted
        ? answered
          ? '5 ms   [ X ]                  10 ms   [ Y ]'
          : done('edge-first')
            ? '5 ms   [ X ]                  Y starts a new batch'
            : 'Expiry runs first. Which requests leave at 5 ms?'
        : done('edge-before')
          ? '5 ms   [ X, Y ]'
          : 'Y arrives one millisecond before expiry.';
      label(line, 960, 976, 42, C.ink, 'center');
    });
    return;
  }
  const gateway = state.beat === 3;
  focus.target('edge-budget', () => {
    const y = 535;
    label(gateway ? 'One chat send operation' : 'Time spent by one request', 145, 286, 42);
    const segments = gateway
      ? ['Gateway', 'Waiting for a decision', 'Late ALLOW']
      : ['Form batch', 'Wait for worker', 'Run inference'];
    const xs = [155, 570, 1250, 1765];
    segments.forEach((segment, i) => {
      const color = [C.blue, C.yellow, C.cyan][i];
      label(segment, (xs[i] + xs[i + 1]) / 2, y - 56, 31, color, 'center');
      api.line(ctx, xs[i], y, xs[i + 1] - 8, y, color, 11);
    });
    if (gateway) {
      api.line(ctx, 1250, 380, 1250, 650, C.pink, 4);
      label('Absolute deadline', 1250, 704, 35, C.pink, 'center');
      if (done('edge-deadline')) label('Hold or suppress', 1250, 782, 45, C.yellow, 'center');
      if (done('edge-late')) label('Operation closed', 1525, y + 80, 30, C.pink, 'center');
    } else {
      label('5 ms limit', 360, y + 94, 35, C.blue, 'center');
      label('Can grow under overload', 910, y + 94, 32, C.yellow, 'center');
      label('Measure to the complete decision', 960, 790, 43, C.ink, 'center');
    }
    label(
      gateway ? 'An accepted upload needs a durable pending record.' : 'Intervals are schematic.',
      145,
      955,
      30,
      C.muted,
    );
  });
}
export default {
  id: 'batch-edge',
  draw: drawBatchEdge,
  cues: [
    'edge-before',
    'edge-shift',
    'edge-ask',
    'edge-first',
    'edge-second',
    'edge-queue',
    'edge-extra',
    'edge-deadline',
    'edge-late',
  ],
};
