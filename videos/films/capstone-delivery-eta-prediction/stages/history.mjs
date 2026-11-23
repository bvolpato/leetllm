import { completed, dimension, estimate, noonOrder } from '../shipment.mjs';

export function drawHistory(ctx, scene, state, api) {
  const { C } = api,
    durations = [8, 10, 12, 14],
    summary = estimate(noonOrder.pickup, durations);
  const x = (h) => 430 + 75 * h,
    middle = api.focus.progress('history-middle', 0) > 0,
    result = completed(api, 'history-eta');
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  api.focus.target('history-strip', () => {
    tx(
      'O-201    /    East-7    /    Expedited    /    History available at noon',
      140,
      245,
      31,
      C.muted,
    );
    tx('From pickup', x(0), 325, 31, C.blue, 'center');
    api.line(ctx, x(0), 348, x(0), 722, C.blue, 3);
    durations.forEach((h, i) => {
      const y = 397 + 101 * i,
        col = middle && (i === 1 || i === 2) ? C.yellow : C.blue;
      tx('Trip ' + (i + 1), 145, y + 11, 35, C.muted);
      api.line(ctx, x(0), y, x(h), y, col, 9);
      api.circle(ctx, x(h), y, 12, col);
      tx(h + ' h', x(h) + 34, y + 13, 36, col);
    });
    if (!middle && state.beat === 0) {
      tx('Fifth trip    /    4 h', 150, 848, 34, C.muted);
      if (api.focus.progress('history-late', 0) > 0)
        tx('Delivered 13:00    /    Recorded 13:05    /    After cutoff', 609, 848, 35, C.pink);
    } else {
      dimension(ctx, api, x(10), x(12), 775, C.yellow);
      if (result) {
        api.circle(ctx, x(summary.median), 775, 13, C.cyan);
        tx(
          '10:00 + ' + summary.median + ' h  =  ' + summary.arrival,
          960,
          886,
          52,
          C.cyan,
          'center',
        );
        tx(
          '4 matches    /    Observed arrivals  ' +
            summary.first +
            ' to ' +
            summary.last +
            ' next day',
          960,
          977,
          32,
          C.muted,
          'center',
        );
      } else
        tx('Pickup 10:00     +     median duration     =     ?', 960, 906, 42, C.ink, 'center');
    }
  });
}
export default {
  id: 'history',
  draw: drawHistory,
  cues: ['history-late', 'history-middle', 'history-eta'],
};
