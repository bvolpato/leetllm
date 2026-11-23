import { cueAmount, cueDone } from '../defaults.mjs';
import { clock } from '../arithmetic.mjs';
import { VISIT_HOURS } from '../fixtures.mjs';

export function drawStateRecord(ctx, scene, state, api) {
  const { C } = api;
  const arrives = cueAmount(state, 'record-reply');
  const hoursKnown = cueDone(state, 'record-hours');
  api.focus.target('task', () => {
    api.text(ctx, 'Requested visit', 140, 273, 31, C.muted);
    api.text(ctx, '90 minutes inside', 455, 273, 38, C.ink);
    api.text(ctx, 'Finish by 17:00', 1300, 273, 38, C.yellow);
  });
  api.focus.target('request', () => {
    api.rect(ctx, 140, 377, 763, 408, C.panel, C.blue, 12);
    api.text(ctx, 'Sent by the host', 200, 451, 32, C.blue);
    api.text(ctx, VISIT_HOURS.id, 200, 541, 50, C.ink, 'left', 'mono');
    api.text(ctx, 'History Museum', 200, 632, 41, C.ink);
    api.text(ctx, 'Visit date   /   today', 200, 720, 34, C.muted);
  });
  api.focus.target('reply', () => {
    const y = 377 - 45 * (1 - arrives);
    api.rect(ctx, 1017, 377, 763, 408, C.bg, C.muted, 12);
    if (!arrives) {
      api.text(ctx, 'Awaiting reply', 1398, 599, 42, C.muted, 'center');
    } else {
      api.rect(ctx, 1017, y, 763, 408, C.panel, C.green, 12);
      api.text(ctx, 'Returned by the hours service', 1077, y + 74, 32, C.green);
      api.text(ctx, VISIT_HOURS.id, 1077, y + 164, 50, C.ink, 'left', 'mono');
      api.text(ctx, 'History Museum   /   today', 1077, y + 255, 37, C.ink);
      api.text(
        ctx,
        hoursKnown
          ? clock(VISIT_HOURS.opens) + ' to ' + clock(VISIT_HOURS.closes)
          : 'Reading hours…',
        1077,
        y + 343,
        45,
        hoursKnown ? C.green : C.muted,
      );
    }
    api.text(
      ctx,
      arrives === 1
        ? 'Received today at 13:55   /   museum hours service'
        : 'A sent request has no closing time.',
      960,
      928,
      35,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'state-record',
  draw: drawStateRecord,
  cues: [
    'record-request',
    'record-empty',
    'record-reply',
    'record-hours',
    'record-close',
    'record-limit',
  ],
};
