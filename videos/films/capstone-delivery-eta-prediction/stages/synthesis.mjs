import { clock } from '../arithmetic.mjs';
import { completed, estimate, freshOrder, limits, propose, scanAt } from '../shipment.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api,
    order = freshOrder,
    selected = scanAt(order.scans, order.snapshot);
  const eta = estimate(order.pickup, order.durations);
  const admitted = completed(api, 'fresh-scan-answer'),
    median = completed(api, 'fresh-median');
  const arrival = completed(api, 'fresh-arrival-answer'),
    warn = completed(api, 'fresh-warn-answer');
  const replay = completed(api, 'fresh-policy-switch'),
    settled = completed(api, 'fresh-track');
  const showTrips = api.focus.progress('fresh-trips', 0) > 0;
  const showPolicy = api.focus.progress('fresh-policy-inputs', 0) > 0;
  const replayEtaPending = replay && !completed(api, 'fresh-fixed-eta');
  const threshold = replay ? 0.6 : 0.4;
  const disposition = propose(selected.age, order.backlogAge, order.risk, threshold);
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  api.focus.target('fresh-receipt', () => {
    tx(
      'New parcel    /    Pickup ' +
        clock(order.pickup) +
        '    /    Snapshot ' +
        clock(order.snapshot) +
        ' UTC',
      135,
      237,
      34,
      C.muted,
    );
    api.line(ctx, 1025, 299, 1025, 958, C.muted, 2);
    tx('Carrier log', 145, 339, 44);
    tx('Event', 441, 417, 31, C.muted);
    tx('Online', 712, 417, 31, C.muted);
    order.scans.forEach((r, i) => {
      const y = 495 + i * 90,
        col = admitted && r.name === selected.name ? C.green : C.ink;
      tx(r.name, 145, y, 36, col);
      tx(clock(r.event), 441, y, 39, col);
      tx(clock(r.available), 712, y, 39, col);
    });
    if (showTrips) {
      tx('Eligible total durations', 145, 691, 31, C.muted);
      order.durations.forEach((h, i) => {
        const x = 192 + i * 191;
        tx(h + ' h', x, 774, 46, median && (i === 1 || i === 2) ? C.yellow : C.blue, 'center');
      });
    }
    if (showPolicy) {
      tx(
        'Backlog ' +
          order.backlogAge +
          ' h  /  limit ' +
          limits.backlog +
          ' h       Scan limit ' +
          limits.scan +
          ' h',
        145,
        886,
        31,
        C.muted,
      );
      tx('Supplied risk  ' + 100 * order.risk + '%', 145, 959, 42, C.blue);
    }
    const right = 1090;
    tx(replay ? 'Policy replay' : 'Tracking receipt', right, 339, 44);
    if (admitted)
      tx(
        selected.name + ' at ' + clock(selected.event) + '    /    ' + selected.age + ' h old',
        right,
        440,
        34,
        C.green,
      );
    else tx('Which scan?   Age?', right, 440, 37, C.cyan);
    if (showTrips) {
      if (median) tx('Median total duration   ' + eta.median + ' h', right, 514, 31, C.muted);
      tx(
        replayEtaPending
          ? 'Issued ETA   ' + eta.arrival
          : arrival
            ? clock(order.pickup) + ' + ' + eta.median + ' h  =  ' + eta.arrival
            : 'Arrival time  ?',
        right,
        615,
        48,
        arrival ? C.cyan : C.ink,
      );
      if (arrival)
        tx('Observed  ' + eta.first + ' to ' + eta.last + ' next day', right, 676, 31, C.muted);
    }
    if (showPolicy) {
      tx(
        'Policy ' + (replay ? 'B' : 'A') + '   /   Warn at ' + Math.round(threshold * 100) + '%',
        right,
        789,
        38,
        C.yellow,
      );
      const show = warn && (!replay || settled);
      const actionLabel = show
        ? disposition.action === 'Propose warning'
          ? 'Propose a warning'
          : disposition.action
        : replay
          ? 'ETA, warning, or both?'
          : 'Which action?';
      tx(actionLabel, right, 897, 43, show ? C.green : C.ink);
      if (replay) tx('At 40% this same score proposed a warning', right, 967, 30, C.muted);
    }
  });
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'fresh-scan-answer',
    'fresh-trips',
    'fresh-median',
    'fresh-arrival-answer',
    'fresh-policy-inputs',
    'fresh-warn-answer',
    'fresh-policy-switch',
    'fresh-track',
    'fresh-fixed-eta',
  ],
};
