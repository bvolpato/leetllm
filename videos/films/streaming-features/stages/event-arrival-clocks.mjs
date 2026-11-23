import { availableHeartbeat, formatClock } from '../arithmetic.mjs';
import { heartbeats } from '../fixtures.mjs';
import {
  heartbeatLabelGaps,
  heartbeatTrace,
  minuteScale,
  receipt,
  requestLine,
  spoken,
} from '../request-clock.mjs';

export function drawEventArrivalClocks(ctx, scene, state, api) {
  const clock = spoken(scene, state);
  const x = minuteScale(0, 1000);
  const cutoff = Math.round(540 + 180 * clock.progress('noon') + 240 * clock.progress('four'));
  const result = availableHeartbeat(heartbeats, cutoff);
  const changing = clock.started('four')
    ? !clock.finished('four-age')
    : clock.started('noon') && !clock.finished('noon-age');
  const selected = changing ? null : result.id;
  api.text(ctx, 'J-204   /   Accepted records are readable on arrival', 108, 230, 32, api.C.muted);
  api.focus.target('clock-history', () => {
    requestLine(ctx, api, x, cutoff, 307, 793, heartbeatLabelGaps([350, 516, 682]));
    heartbeats.forEach((record, i) => {
      heartbeatTrace(ctx, api, {
        record,
        x,
        y: 350 + i * 166,
        sent: i < 2 || clock.started('third'),
        transit: i < 2 ? 1 : clock.progress('third'),
        selected: record.id === selected,
        rightLabels: i === 0,
      });
    });
  });
  api.focus.target('clock-row', () =>
    receipt(ctx, api, {
      y: 925,
      label: `${formatClock(cutoff)} request`,
      value: changing
        ? 'Heartbeat  ?      Age  ?'
        : `${result.id}     ${formatClock(cutoff)} − ${formatClock(result.event)} = ${result.ageHours} h`,
      color: changing ? api.C.yellow : api.C.green,
    }),
  );
}
export default {
  id: 'event-arrival-clocks',
  draw: drawEventArrivalClocks,
  cues: ['third', 'noon', 'noon-age', 'four', 'four-age'].map(
    (id) => 'sf-event-arrival-clocks-' + id,
  ),
};
