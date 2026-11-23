import { availableHeartbeat, formatClock } from '../arithmetic.mjs';
import { cutoff09, heartbeats } from '../fixtures.mjs';
import { receipt, spoken } from '../request-clock.mjs';

function heartbeatPacket(ctx, api, record, x, y, inTransit = false) {
  const { C } = api;
  const ink = inTransit ? C.bg : C.blue;
  api.rect(
    ctx,
    x - 159,
    y - 57,
    318,
    114,
    inTransit ? C.cyan : C.panel,
    inTransit ? C.cyan : C.blue,
    14,
  );
  api.text(ctx, record.id, x - 120, y - 4, 46, ink);
  const pulse = [
    [0, 0],
    [29, 0],
    [39, -20],
    [53, 12],
    [62, 0],
    [91, 0],
  ];
  api.path(
    ctx,
    pulse.map(([dx, dy]) => ({ x: x + dx, y: y - 18 + dy })),
    { color: ink, width: 6 },
  );
  api.text(
    ctx,
    `Sent ${formatClock(record.event)}`,
    x,
    y + 39,
    38,
    inTransit ? ink : C.ink,
    'center',
  );
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  const [first, second] = heartbeats;
  const live = availableHeartbeat(heartbeats, cutoff09);
  const audit = heartbeats.filter((row) => row.event <= cutoff09).at(-1);
  const resolved = clock.finished('age');
  const landed = clock.finished('second-read');
  // Enter during delivery, freeze at the request, then finish the trip with the voice.
  const requestTime = state.cues?.['sf-intro-second']?.end ?? 2.4;
  const approach = 0.1 + 0.9 * Math.min(1, state.t / requestTime);
  const now =
    second.event +
    (cutoff09 - second.event) * approach +
    (second.available - cutoff09) * clock.progress('second-read');
  const approachX = api.lerp(510, 940, approach);
  const packetX = api.lerp(approachX, 1540, clock.progress('second-read'));

  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.text(ctx, 'Worker', 245, 355, 45, C.ink, 'center');
  for (const y of [426, 494, 562]) {
    api.rect(ctx, 122, y - 28, 246, 56, C.panel, C.muted, 11);
    api.circle(ctx, 155, y, 8, C.cyan);
    api.line(ctx, 206, y, 325, y, C.muted, 4);
  }
  api.text(ctx, 'Report job J-204', 245, 662, 34, C.muted, 'center');
  api.text(ctx, 'Feature store', 1540, 306, 45, C.ink, 'center');
  api.rect(ctx, 1316, 335, 448, 366, C.panel, C.blue, 19);
  api.line(ctx, 368, 562, 1316, 562, C.muted, 4);

  api.text(ctx, 'Scheduler clock', 880, 282, 34, C.muted, 'center');
  api.text(ctx, formatClock(Math.floor(now)), 880, 397, 100, C.yellow, 'center');
  api.focus.target('first-heartbeat', () => {
    if (landed) return;
    api.text(ctx, `Readable ${formatClock(first.available)}`, 1540, 378, 32, C.blue, 'center');
    heartbeatPacket(ctx, api, first, 1540, 445);
  });
  api.focus.target('second-heartbeat', () => {
    if (!landed) api.line(ctx, 368, 562, packetX - 159, 562, C.cyan, 7);
    heartbeatPacket(ctx, api, second, packetX, 562, !landed);
    if (landed)
      api.text(ctx, `Readable ${formatClock(second.available)}`, 1540, 666, 32, C.blue, 'center');
  });
  api.focus.target('morning-row', () =>
    receipt(ctx, api, {
      y: 819,
      label: '09:00 training row',
      value: resolved
        ? `${live.id}     09:00 − ${formatClock(live.event)} = ${live.ageHours} h`
        : 'Heartbeat  ?      Age  ?',
      color: resolved ? C.green : C.yellow,
    }),
  );
  api.focus.target('replay-row', () => {
    if (!clock.started('hindsight')) return;
    receipt(ctx, api, {
      y: 961,
      label: '09:00 replay using worker times alone',
      value: clock.finished('hindsight')
        ? `${audit.id}     09:00 − ${formatClock(audit.event)} = ${cutoff09 - audit.event} min`
        : `09:00 − ${formatClock(audit.event)}`,
      color: C.pink,
    });
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['second', 'first', 'question', 'age', 'second-read', 'hindsight'].map(
    (id) => 'sf-intro-' + id,
  ),
};
