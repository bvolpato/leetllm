import { deliveryState } from '../arithmetic.mjs';
import { tokenTimes } from '../fixtures.mjs';
import { clientEvents, clientY, deliveryX, eventRail, transportPath } from '../delivery-trace.mjs';
import { bracket, passage, spoken } from '../trace.mjs';

const server = tokenTimes.map((time, i) => ({ time, ids: ['T' + (i + 1)] }));
const direct = server.map(({ time, ids }) => ({ time: time + 30, ids }));
const joint = clientEvents.at(-1);
const previous = clientEvents.at(-2);
const gap = joint.time - previous.time;

export function drawDelivery(ctx, scene, state, api) {
  const { C } = api;
  const constant = state.beat === 0;
  const toBuffer = passage(state, 1, 'buffer-two', 0.23, 0.59);
  const flush = passage(state, 1, 'flush-two', 0.68, 0.93);
  const clock = constant
    ? tokenTimes[0] +
      (direct.at(-1).time - tokenTimes[0]) * passage(state, 0, 'trace-crossings', 0.3, 0.65)
    : previous.time +
      (tokenTimes.at(-1) - previous.time) * toBuffer +
      (joint.time - tokenTimes.at(-1)) * flush;
  const replay = deliveryState(clock);
  const received = constant ? direct.filter((e) => e.time <= clock) : replay.events;

  api.focus.target('delivery-lanes', () => {
    api.text(
      ctx,
      constant
        ? 'A   ·   30 ms transit per token'
        : 'A   ·   replay with a buffered final delivery',
      122,
      267,
      34,
      C.ink,
    );
    api.text(ctx, 'Server clock   ·   ms', 1770, 267, 30, C.muted, 'right');
    eventRail(ctx, api, 'Server', server);
    eventRail(ctx, api, 'Client', received);
    server.forEach(({ time }, i) => {
      if (constant || i < 2) {
        const p = Math.max(0, Math.min(1, (clock - time) / 30));
        transportPath(ctx, api, time, time + 30, p, C.muted);
      } else if (clock >= time) {
        // Keep each token at its emission column until the flush carries both to the same receipt.
        if (flush === 0) api.circle(ctx, deliveryX(time), 470, 9, C.yellow);
        transportPath(ctx, api, time, joint.time, flush, C.yellow);
      }
    });
    if (!constant && state.beat === 1) {
      const held = replay.buffer.join(' + ');
      api.text(
        ctx,
        held
          ? 'In buffer   ' + held
          : clock >= joint.time
            ? 'Buffer empty   ·   pair delivered'
            : 'Replay begins at client T2',
        960,
        937,
        44,
        held ? C.yellow : C.ink,
        'center',
      );
    } else if (state.beat >= 2) {
      bracket(
        ctx,
        api,
        deliveryX(previous.time),
        deliveryX(joint.time),
        clientY + 89,
        C.pink,
        spoken(state, 2, 'event-gap', 0.39) ? gap + ' ms between receipts' : '',
      );
      const average = gap / joint.ids.length;
      const label =
        state.beat === 3 && spoken(state, 3, 'join-ids', 0.25)
          ? 'Server T3 at ' + tokenTimes[2] + ' ms   →   client receipt at ' + joint.time + ' ms'
          : spoken(state, 2, 'event-average', 0.75)
            ? gap + ' ms  /  ' + joint.ids.length + ' delivered tokens  =  ' + average + ' ms/token'
            : '';
      if (label) api.text(ctx, label, 960, 965, 41, C.yellow, 'center');
    } else {
      api.text(ctx, 'One delivery per token', 960, 937, 40, C.muted, 'center');
    }
  });
}

export default {
  id: 'delivery',
  draw: drawDelivery,
  cues: ['trace-crossings', 'buffer-two', 'flush-two', 'event-gap', 'event-average', 'join-ids'],
};
